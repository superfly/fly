import dispatcherInit from './fly/dispatcher'

import { fireFetchEvent, addEventListener, dispatchEvent, FetchEvent, emitter } from "./events"
import { Middleware, MiddlewareChain } from "./middleware"
import { FlyBackend } from "./fly-backend"
import { ReadableStream, WritableStream, TransformStream } from 'web-streams-polyfill'

import consoleInit from './console'
import flyInit from './fly'

import { URL, URLSearchParams } from 'universal-url-lite'//'whatwg-url'
import Headers from './headers'

import textEncodingInit, { TextEncoder, TextDecoder } from './text-encoding'
import fetchInit from './fetch'
import bodyMixin from './ts/body_mixin.ts'
import Blob from './ts/blob.ts'
import FormData from './ts/form_data.ts'
import cryptoInit, { crypto } from './ts/crypto.ts'
import responseInit from './response'
import cache from './cache'
import timersInit, { setTimeout, clearTimeout, setInterval, clearInterval } from './timers'

import { Document, Element } from './document'

// Sets up `Error.prepareStacktrace`
import errorsInit from './utils/error'

import registerFlyBackend from './middleware/fly-backend'
import registerFlyEcho from './middleware/fly-echo'
import registerFlyRoutes from './middleware/fly-routes'
import registerForceSSL from './middleware/force-ssl'
import registerGoogleAnalytics from './middleware/google-analytics'
import registerSession from './middleware/session'

const mwToRegister = [registerFlyBackend, registerFlyEcho, registerFlyRoutes, registerForceSSL, registerGoogleAnalytics,
	registerSession]

global.releasables = []
global.middleware = {}

global.registerMiddleware = function registerMiddleware(type, fn) {
	middleware[type] = fn
}

global.bootstrap = function bootstrap() {
	const ivm = global._ivm

	// Cleanup, early!
	delete global._ivm
	delete global.bootstrap

	const dispatcher = dispatcherInit(ivm, global._dispatch)
	delete global._dispatch

	errorsInit(ivm, dispatcher)

	global.fly = flyInit(ivm, dispatcher)

	global.console = consoleInit(ivm, dispatcher)
	timersInit(ivm, dispatcher)
	Object.assign(global, { setTimeout, clearTimeout, setInterval, clearInterval })

	// Web primitives (?)
	global.ReadableStream = ReadableStream
	global.WritableStream = WritableStream
	global.TransformStream = TransformStream

	textEncodingInit(ivm, dispatcher)
	global.TextEncoder = TextEncoder
	global.TextDecoder = TextDecoder

	// Web API
	cryptoInit(ivm, dispatcher)
	global.crypto = crypto
	global.URL = URL
	global.URLSearchParams = URLSearchParams
	global.Headers = Headers
	global.fetch = fetchInit(ivm, dispatcher)
	global.Body = bodyMixin
	global.Blob = Blob
	global.FormData = FormData
	global.Response = responseInit(ivm, dispatcher)
	global.Request = require('./request').Request

	// oh boy
	global.cache = cache

	// Events
	global.fireFetchEvent = fireFetchEvent.bind(null, ivm)
	global.addEventListener = addEventListener
	global.dispatchEvent = dispatchEvent

	global.FetchEvent = FetchEvent

	// DOM
	global.Document = Document
	global.Element = Element

	// Fly-specific
	global.FlyBackend = FlyBackend

	// Middleware
	global.Middleware = Middleware
	global.MiddlewareChain = MiddlewareChain

	global.getHeapStatistics = function getHeapStatistics() {
		return new Promise((resolve, reject) => {
			const cb = new ivm.Reference(function (err, heap) {
				cb.release()
				if (err) {
					reject(err)
					return
				}
				resolve(heap)
			})
			dispatcher.dispatch('getHeapStatistics', cb).catch((err) => {
				try { cb.release() } catch (e) { }
				reject(err)
			})
		})
	}

	// load all middleware
	for (const mwReg of mwToRegister)
		mwReg(ivm, dispatcher)
}

global.finalizers = []

global.finalize = function finalize() {
	while (finalizers.length) {
		try { finalizers.shift()() } catch (e) { }
	}
}

global.teardown = global.release = function release() {
	releaseReleasables()
	emitter.removeAllListeners()

	// violent
	// for (const prop of Object.getOwnPropertyNames(global))
	// 	try { global[prop] = null } catch (e) { }
}

function releaseReleasables() {
	while (releasables.length) {
		try { releasables.shift().release() } catch (e) { }
	}
}