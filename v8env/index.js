// import dispatcherInit from './fly/dispatcher'
import bridgeInit from './bridge'

import { fireFetchEvent, addEventListener, dispatchEvent, FetchEvent, emitter } from "./events"
import { ReadableStream, WritableStream, TransformStream } from 'web-streams-polyfill'

import { console } from './console'
import flyInit from './fly'

import { URL, URLSearchParams } from 'universal-url-lite'//'whatwg-url'
import Headers from './headers'

import { TextEncoder, TextDecoder } from './text-encoding'
import { fetch } from './fetch'
import Body from './ts/body_mixin.ts'
import Blob from './ts/blob.ts'
import FormData from './ts/form_data.ts'
import { crypto } from './ts/crypto.ts'
import { Response } from './response'
import { Request } from './request'
import cache from './cache'
import { setTimeout, clearTimeout, setInterval, clearInterval } from './timers'

import { Document, Element } from './document'

import { MiddlewareChain } from './middleware'

global.middleware = {}

global.bootstrap = function bootstrap() {
	const ivm = global._ivm

	// Cleanup, early!
	delete global._ivm
	delete global.bootstrap

	// Bridge is used everywhere to transfer values to node
	bridgeInit(ivm, global._dispatch)
	delete global._dispatch

	// Sets up `Error.prepareStacktrace`, for source map support
	require('./error')

	global.fly = flyInit()

	global.console = console

	Object.assign(global, {
		setTimeout, clearTimeout, setInterval, clearInterval,
		ReadableStream, WritableStream, TransformStream,
		TextEncoder, TextDecoder,
		Headers, Request, Response, fetch, Body,
		Blob, FormData, URL, URLSearchParams,
		cache, crypto,
		MiddlewareChain // ugh
	})

	// Events
	global.fireFetchEvent = fireFetchEvent
	global.addEventListener = addEventListener
	global.dispatchEvent = dispatchEvent

	global.FetchEvent = FetchEvent

	// DOM
	global.Document = Document
	global.Element = Element

	global.getHeapStatistics = function getHeapStatistics() {
		return new Promise((resolve, reject) => {
			bridge.dispatch("getHeapStatistics", function (err, heap) {
				if (err) {
					reject(err)
					return
				}
				resolve(heap)
			})
		})
	}
}