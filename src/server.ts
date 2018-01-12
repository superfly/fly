import * as http from 'http';
import * as ivm from 'isolated-vm';
import { Isolate, IsolatePool } from './isolate';
import * as url from 'url';
import * as net from 'net';
import * as fs from 'fs';
import { Config } from './config'
import log from './log'
import * as genericPool from 'generic-pool';
import { Trace } from './trace';
import mksuid from "mksuid"
import * as httpUtils from './utils/http'
import { Readable, Writable, Transform } from 'stream'
import { AppStore } from './app/store'
import { createIsoPool } from './isolate'

const proxiedHttp = require('findhit-proxywrap').proxy(http, { strict: false })
const { version } = require('../package.json');

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

export interface ServerOptions {
	isoPool?: IsolatePool
	isoPoolMin?: number
	isoPoolMax?: number
}

export class Server {
	server: http.Server
	config: Config
	options: ServerOptions
	isoPool: IsolatePool

	constructor(config: Config, options?: ServerOptions) {
		this.config = config
		this.options = options || {}
		if (options && options.isoPool)
			this.isoPool = options.isoPool
		this.server = proxiedHttp.createServer(this.handleRequest.bind(this));
	}

	async start() {
		this.server.on('listening', () => {
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
					throw e;
				}).on('error', (e: any) => {
					if (e.code !== 'ECONNREFUSED') throw e;
					// not in use: delete it and re-listen
					fs.unlinkSync(this.config.port.toString());
					this.server.listen(this.config.port.toString());
				});
			}
		});

		this.isoPool = this.isoPool || await createIsoPool({
			min: this.options.isoPoolMin || 20,
			max: this.options.isoPoolMax || 100
		})
		this.server.listen(this.config.port);
	}

	private async handleRequest(request: http.IncomingMessage, response: http.ServerResponse): Promise<void> {
		if (request.url === undefined) // wtf
			return

		const requestID = mksuid()
		let fullT = Trace.start("request")
		let isoPool = this.isoPool
		if (!isoPool) {
			isoPool = this.isoPool = await createIsoPool()
		}

		if (request.headers.host === undefined)
			return

		if (request.url == undefined) { // that can't really happen?
			return
		}

		if (!this.config.appStore) {
			throw new Error("please define a configStore")
		}

		response.setHeader("Server", `fly (${version})`)

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
			response.writeHead(404)
			response.end()
			return
		}

		if (!app.code) {
			response.writeHead(400)
			response.end("app has no code")
			return
		}

		const scheme = "http:"

		let t = Trace.start("acquire iso from pool")
		let iso = await isoPool.acquire()
		t.end()

		let ctx = iso.ctx

		try {
			let jail = ctx.globalReference()

			const fullURL = httpUtils.fullURL(scheme, request)

			const setContext = jail.getSync("setContext")

			setContext.apply(null, [
				new ivm.ExternalCopy({
					appID: app.id,
					appSettings: app.settings,

					requestID: requestID,
					originalScheme: scheme,
					originalHost: request.headers.host,
					originalPath: request.url,
					originalURL: fullURL
				}).copyInto()
			])

			let t = Trace.start("compile custom script")
			let script = iso.iso.compileScriptSync(app.code, { filename: "code.js" })
			t.end()
			t = Trace.start("run custom script")
			let ret = script.runSync(ctx)
			t.end()

			let fireEvent = jail.getSync("fireEvent")

			request.pause()

			let reqForV8 = new ivm.ExternalCopy({
				method: request.method,
				headers: httpUtils.headersForWeb(request.rawHeaders),
				remoteAddr: request.connection.remoteAddress
			}).copyInto()

			let finalResponse = {
				status: 200,
				statusText: "OK",
				ok: true,
				url: fullURL,
				headers: {}
			}
			let finalHeaders: http.OutgoingHttpHeaders = {}

			t = Trace.start("process 'fetch' event")
			// log.debug("calling fireEvent")
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
				new ivm.Reference(function (err: any, res: any, resBody: ArrayBuffer, proxy?: ivm.Reference<http.IncomingMessage>) {
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

					response.writeHead(res.status)

					let resProm: Promise<void>

					if (!resBody && proxy) {
						let res = proxy.deref()
						resProm = handleResponse(res, response, fireEvent)
					} else if (resBody) {
						log.debug("got a body", resBody instanceof ArrayBuffer)
						resProm = handleResponse(bufferToStream(Buffer.from(resBody)), response, fireEvent)
					} else {
						resProm = Promise.resolve()
					}

					resProm.then(() => {
						fullT.end()
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
							new ivm.Reference(function () { // done callback
								log.debug("finished all fetchEnd")
								try {
									setTimeout(() => {
										if (!isoPool)
											return
										isoPool.destroy(iso)
									}, 1000)
								} catch (err) {
									log.error("error destroying isolate", err)
								}
							})
						])
					})
				})
			])

		} catch (e) {
			log.error("error...", e, e.stack)
			response.statusCode = 500
			response.end("Critical error.")
			return
		}
	}

	stop() {
		return new Promise((resolve, reject) => {
			if (!this.isoPool)
				return
			this.isoPool.drain().then(() => {
				log.info("drained pool")
				if (!this.isoPool)
					return
				this.isoPool.clear().then(() => {
					log.info("cleared pool")
					this.server.close(() => {
						log.info("closed server")
						resolve()
					})
				}).catch(reject)
			}).catch(reject)
		})
	}
}

function handleResponse(src: Readable, dst: Writable, fireEvent: ivm.Reference<Function>): Promise<void> {
	return new Promise(function (resolve, reject) {
		let getChunk = Trace.start("get chunk")
		const tr = new Transform({
			transform(chunk, encoding, callback) {
				getChunk.end().start()
				let t = Trace.start("push chunk")
				// log.debug("chunk:", chunk.toString())
				const toSend = Buffer.isBuffer(chunk) ? bufferToArrayBuffer(chunk) : chunk
				// log.debug("toSend:", toSend)
				try {
					fireEvent.apply(null, [
						"responseChunk",
						new ivm.ExternalCopy(toSend).copyInto(),
						new ivm.Reference(function (err: any, newChunk: string | ArrayBuffer | Buffer) {
							if (err) {
								log.error("error processing chunk", err)
								newChunk = chunk
							}
							setImmediate(() => {
								t.end()
								try {
									if (Buffer.isBuffer(newChunk))
										callback(null, newChunk)
									else if (newChunk instanceof ArrayBuffer)
										callback(null, Buffer.from(newChunk))
									else if (typeof newChunk === 'string')
										callback(null, Buffer.from(newChunk, 'utf8'))
								} catch (err) {
									log.error("error calling back", err)
								}
							})
						})
					])
				} catch (err) {
					log.error("error applying chunk event", err)
					callback(err)
				}
			}
		})
		setImmediate(() => {
			src.pipe(tr).pipe(dst)
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