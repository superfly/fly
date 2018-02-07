import { fireEventInit, addEventListener, dispatchEvent, FetchEvent } from "./events"
import { Middleware, MiddlewareChain } from "./middleware"
import { FlyBackend } from "./fly-backend"
import { ReadableStream, WritableStream, TransformStream } from 'web-streams-polyfill'
import SessionStore from './session_store'

import { TextEncoder, TextDecoder } from 'text-encoding'

import consoleInit from './console'
import flyInit from './fly'

import URL from './url'
import Headers from './headers'

import fetchInit from './fetch'
import bodyInit from './body'
import formDataInit from './formdata'
import responseInit from './response'
import requestInit from './request'
import cacheInit from './cache'
import timersInit from './timers'

import registerFlyBackend from './middleware/fly-backend'
import registerFlyEcho from './middleware/fly-echo'
import registerFlyRoutes from './middleware/fly-routes'
import registerForceSSL from './middleware/force-ssl'
import registerGoogleAnalytics from './middleware/google-analytics'
import registerSession from './middleware/session'

const mwToRegister = [registerFlyBackend, registerFlyEcho, registerFlyRoutes, registerForceSSL, registerGoogleAnalytics, registerSession]

import './local'

global.middleware = {}

global.registerMiddleware = function registerMiddleware(type, fn) {
	global.middleware[type] = fn
}

global.bootstrap = function bootstrap() {
	const ivm = global._ivm
	const dispatch = global._dispatch

	// Cleanup, early!
	delete global._ivm
	delete global._dispatch
	delete global.bootstrap

	global.console = consoleInit(ivm)

	timersInit(ivm)

	global.fly = flyInit(ivm, dispatch)

	// Web primitives (?)
	global.ReadableStream = ReadableStream
	global.WritableStream = WritableStream
	global.TransformStream = TransformStream

	global.TextEncoder = TextEncoder
	global.TextDecoder = TextDecoder

	// Web API
	global.URL = URL
	global.Headers = Headers
	global.fetch = fetchInit(ivm, dispatch)
	global.Body = bodyInit(ivm, dispatch)
	global.FormData = formDataInit(ivm, dispatch)
	global.Response = responseInit(ivm, dispatch)
	global.Request = requestInit(ivm, dispatch)

	// oh boy
	global.cache = cacheInit(ivm, dispatch)
	global.session = new SessionStore()

	// Events
	global.fireEvent = fireEventInit(ivm, dispatch)
	global.addEventListener = addEventListener
	global.dispatchEvent = dispatchEvent

	global.FetchEvent = FetchEvent

	// DOM
	// TODO: Reenable.
	// global.Document = require('./document')

	// Fly-specific
	global.FlyBackend = FlyBackend

	// Middleware
	global.Middleware = Middleware
	global.MiddlewareChain = MiddlewareChain

	// load all middleware
	for (const mwReg of mwToRegister)
		mwReg(ivm, dispatch)

}