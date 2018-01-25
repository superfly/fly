import * as http from 'http';
import { ivm } from './'
import * as url from 'url';
import * as net from 'net';
import * as fs from 'fs';
import { Config } from './config'
import log from './log'
import { Trace } from './trace';
import mksuid from "mksuid"
import * as httpUtils from './utils/http'
import { Readable, Writable, Transform } from 'stream'
import { AppStore } from './app/store'
import { Context } from './context'
import { App } from './app'

import EventEmitter = require('events')
import { DefaultContextStore } from './default_context_store';

const proxiedHttp = require('findhit-proxywrap').proxy(http, { strict: false })
const { version } = require('../package.json');

const fetchTimeout = 1000
const fetchEndTimeout = 5000

const hopHeaders = [
	// From RFC 2616 section 13.5.1
	"Connection",
	"Keep-Alive",
	"Proxy-Authenticate",
	"Proxy-Authorization",
	"TE",
	"Trailers",
	"Transfer-Encoding",
	"Upgrade",

	// We don't want to trigger upstream HTTPS redirect
	"Upgrade-Insecure-Requests"
]

const statusPath = "/__fly/status"
export interface RequestMeta {
	app: App,
	startedAt: [number, number], //process.hrtime() ya know
	endedAt?: [number, number],
	id: string,
	originalURL: string,
}

declare module 'http' {
	interface IncomingMessage {
		meta: RequestMeta
		ctx?: Context
	}
}

export interface ServerOptions {
	isTLS?: boolean
	onRequest?: Function
}

export class Server extends EventEmitter {
	server: http.Server
	config: Config
	options: ServerOptions

	constructor(config: Config, options?: ServerOptions) {
		super()
		this.config = config
		this.options = options || {}
		this.server = proxiedHttp.createServer(this.handleRequest.bind(this));
	}

	async start() {
		this.server.on('listening', () => {
			this.emit('listening')
			log.info("Server listening on", this.config.port);
			// set permissions
			if (typeof this.config.port === "string") {
				fs.chmod(this.config.port.toString(), 0o777, () => { });
			}
		});

		// double-check EADDRINUSE
		this.server.on('error', (e: any) => {
			if (typeof this.config.port === "string") {
				if (e.code !== 'EADDRINUSE') throw e;
				net.connect({ path: this.config.port.toString() }, () => {
					// really in use: re-throw
					log.error(this.config.port.toString(), "socket already in use")
					this.emit('error', e)
				}).on('error', (e: any) => {
					if (e.code !== 'ECONNREFUSED') throw e;
					// not in use: delete it and re-listen
					fs.unlinkSync(this.config.port.toString());
					this.server.listen(this.config.port.toString());
				});
			} else {
				this.emit('error', e)
			}
		});

		this.server.listen(this.config.port);
	}

	private async handleRequest(request: http.IncomingMessage, response: http.ServerResponse) {
		const startedAt = process.hrtime()
		const requestID = mksuid()
		if (request.url === undefined) // wtf
			return

		if (request.headers.host === undefined)
			return

		if (request.url == undefined) { // that can't really happen?
			return
		}

		if (!this.config.appStore) {
			throw new Error("please define an appStore")
		}

		let finalHeaders: http.OutgoingHttpHeaders = {}

		response.setHeader("Server", `fly (${version})`)

		if (request.url === statusPath) {
			response.writeHead(200)
			response.end()
			return
		}

		request.headers['x-request-id'] = requestID

		let app: any
		try {
			app = await this.config.appStore.getAppByHostname(request.headers.host)
		} catch (err) {
			log.error("error getting app", err)
			response.writeHead(500)
			response.end()
			return
		}

		log.info("checked app for", request.headers.host)

		if (!app) {
			if (await this.runRequestHook(null, request, response))
				return
			response.writeHead(404)
			response.end()
			return
		}

		const scheme = this.options.isTLS ? 'https:' : 'http:'
		const fullURL = httpUtils.fullURL(scheme, request)

		request.meta = {
			id: requestID,
			app: app,
			startedAt: startedAt,
			originalURL: fullURL,
		}
		this.emit('request', request)

		try {

			if (!app.code) {
				if (await this.runRequestHook(null, request, response))
					return
				response.writeHead(400)
				response.end("app has no code")
				return
			}

			if (!this.config.contextStore)
				this.config.contextStore = new DefaultContextStore()

			let t = Trace.start("acquire context from context store")
			let ctx = await this.config.contextStore.getContext(app)
			t.end()

			if (await this.runRequestHook(ctx, request, response))
				return

			let flyDepth = 0
			let flyDepthHeader = <string>request.headers["x-fly-depth"]
			if (flyDepthHeader) {
				log.debug("got depth header: ", flyDepthHeader)
				flyDepth = parseInt(flyDepthHeader)
				if (isNaN(flyDepth) || flyDepth < 0) {
					flyDepth = 0
				}
			}

			ctx.meta = new Map<string, any>([
				...ctx.meta,
				['app', app],

				['requestID', requestID],
				['originalScheme', scheme],
				['originalHost', request.headers.host],
				['originalPath', request.url],
				['originalURL', fullURL],
				['flyDepth', flyDepth]
			])

			ctx.set('app', new ivm.ExternalCopy(app).copyInto())

			let fireEvent = await ctx.get("fireEvent")

			request.pause()

			let reqForV8 = new ivm.ExternalCopy({
				method: request.method,
				headers: httpUtils.headersForWeb(request.rawHeaders),
				remoteAddr: request.connection.remoteAddress
			}).copyInto()

			t = Trace.start("process 'fetch' event")
			await new Promise((resolve, reject) => { // mainly to make try...finally work
				fireEvent.apply(undefined, [
					"fetch",
					fullURL,
					reqForV8,
					new ivm.Reference(request),
					new ivm.Reference(function (callback: ivm.Reference<Function>) { // readBody
						let t = Trace.start("read native body")
						setImmediate(() => {
							let readDone = false
							request.on("end", () => {
								readDone = true
								callback.apply(undefined, ["end"])
							})
							request.on("close", () => {
								readDone = true
								callback.apply(undefined, ["close"])
							})
							do {
								let data = request.read()
								if (!data)
									break
								log.debug("got data!", typeof data, data instanceof Buffer)
								callback.apply(undefined, [
									"data", new ivm.ExternalCopy(bufferToArrayBuffer(data)).copyInto()
								])
								t.end()
							} while (!readDone)
						})
					}),
					new ivm.Reference((err: any, res: any, resBody: ArrayBuffer, proxy?: ivm.Reference<http.IncomingMessage>) => {
						t.end()

						if (err) {
							log.error("error from fetch callback:", err)
							return
						}

						for (let n in res.headers) {
							try {
								const niceName = httpUtils.normalizeHeader(n)
								const val = res.headers[n]
								response.setHeader(niceName, val)
								finalHeaders[niceName] = val
							} catch (err) {
								log.error("error setting header", err)
							}
						}

						for (let n of hopHeaders)
							response.removeHeader(n)


						response.setHeader("Server", `fly (${version})`)
						response.writeHead(res.status)

						let resProm: Promise<void>

						if (!resBody && proxy) {
							let res = proxy.deref()
							resProm = handleResponse(res, response)
						} else if (resBody) {
							log.debug("got a body", resBody instanceof ArrayBuffer)
							resProm = handleResponse(bufferToStream(Buffer.from(resBody)), response)
						} else {
							resProm = Promise.resolve()
						}

						resProm.then(() => {
							request.meta.endedAt = process.hrtime()
							response.end() // we are done. triggers 'finish' event
							resolve()
							let finalResponse = {
								status: 200,
								statusText: "OK",
								ok: true,
								url: fullURL,
								headers: {}
							}

							log.debug("res sent.")
							finalResponse.status = res.status
							finalResponse.statusText = res.statusText
							finalResponse.ok = res.statusCode && res.statusCode >= 200 && res.statusCode < 400
							finalResponse.headers = finalHeaders
							fireEvent.apply(undefined, [
								"fetchEnd",
								fullURL,
								reqForV8,
								new ivm.ExternalCopy(finalResponse),
								null,
								new ivm.Reference(() => { // done callback
									log.debug("finished all fetchEnd")
									if (this.config.contextStore)
										this.config.contextStore.putContext(ctx)
								})
							], { timeout: fetchEndTimeout })
						})
					})
				], { timeout: fetchTimeout })
			})

		} catch (e) {
			log.error("error...", e, e.stack)
			response.statusCode = 500
			response.end("Critical error.")
		} finally {
			this.emit('requestEnd', request, response)
		}
	}

	async runRequestHook(ctx: Context | null, req: http.IncomingMessage, res: http.ServerResponse) {
		if (this.options.onRequest) {
			await this.options.onRequest(ctx, req, res)
			return res.finished
		}
	}

	stop() {
		return new Promise((resolve, reject) => {
			this.server.close(() => {
				log.info("closed server")
				resolve()
			})
		})
	}
}

function handleResponse(src: Readable, dst: Writable): Promise<void> {
	return new Promise(function (resolve, reject) {
		setImmediate(() => {
			src.pipe(dst)
				.on("finish", function () {
					resolve()
				}).on("error", reject)
		})
	})
}

let Duplex = require('stream').Duplex;
function bufferToStream(buffer: Buffer) {
	let stream = new Duplex();
	stream.push(buffer);
	stream.push(null);
	return stream;
}

function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
	return buffer.buffer.slice(
		buffer.byteOffset, buffer.byteOffset + buffer.byteLength
	)
}