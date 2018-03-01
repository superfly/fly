import dispatcherInit from './fly/dispatcher'

import { fireEvent, addEventListener, dispatchEvent, FetchEvent } from "./events"
import { Middleware, MiddlewareChain } from "./middleware"
import { FlyBackend } from "./fly-backend"
import { ReadableStream, WritableStream, TransformStream } from 'web-streams-polyfill'

import { TextEncoder, TextDecoder } from 'text-encoding'

import consoleInit from './console'
import flyInit from './fly'

import { URL, URLSearchParams } from 'whatwg-url'
import Headers from './headers'

import fetchInit from './fetch'
import bodyMixin from './ts/body_mixin.ts'
import Blob from './ts/blob.ts'
// import formDataInit from './formdata'
import responseInit from './response'
import requestInit from './request'
import cache from './cache'
import timersInit from './timers'

import { Document, Element } from './document'

// Sets up `Error.prepareStacktrace`
import './utils/error'

import registerFlyBackend from './middleware/fly-backend'
import registerFlyEcho from './middleware/fly-echo'
import registerFlyRoutes from './middleware/fly-routes'
import registerForceSSL from './middleware/force-ssl'
import registerGoogleAnalytics from './middleware/google-analytics'
import registerSession from './middleware/session'

const mwToRegister = [registerFlyBackend, registerFlyEcho, registerFlyRoutes, registerForceSSL, registerGoogleAnalytics, registerSession]

global.releasables = []
global.middleware = {}

global.registerMiddleware = function registerMiddleware(type, fn) {
	global.middleware[type] = fn
}

global.bootstrap = function bootstrap() {
	const ivm = global._ivm

	// Cleanup, early!
	delete global._ivm
	delete global.bootstrap

	const dispatcher = dispatcherInit(ivm, global._dispatch)
	delete global._dispatch

	global.fly = flyInit(ivm, dispatcher)
	global.releasables.push(global._dispatch)

	global.console = consoleInit(ivm, dispatcher)
	timersInit(ivm)

	// // Web primitives (?)
	global.ReadableStream = ReadableStream
	global.WritableStream = WritableStream
	global.TransformStream = TransformStream

	global.TextEncoder = TextEncoder
	global.TextDecoder = TextDecoder

	// // Web API
	global.URL = URL
	global.URLSearchParams = URLSearchParams
	global.Headers = Headers
	global.fetch = fetchInit(ivm, dispatcher)
	global.Body = bodyMixin
	global.Blob = Blob
	// global.FormData = formDataInit(ivm, dispatcher)
	global.Response = responseInit(ivm, dispatcher)
	global.Request = requestInit(ivm, dispatcher)

	// oh boy
	global.cache = cache

	// // Events
	global.fireEvent = fireEvent.bind(null, ivm)
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
			dispatcher.dispatch('getHeapStatistics', new ivm.Reference(function (err, heap) {
				if (err) {
					reject(err)
					return
				}
				resolve(heap)
			}))
		})
	}

	// load all middleware
	for (const mwReg of mwToRegister)
		mwReg(ivm, dispatcher)
}

global.sourceMaps = {}

global.teardown = function teardown() {
	let r;
	while (r = global.releasables.pop()) {
		try {
			r.release()
		} catch (e) {
			// fail silently
		}
	}
}