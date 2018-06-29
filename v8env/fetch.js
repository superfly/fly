import { logger } from './logger'
import refToStream, { isFlyStream } from './fly/streams'

/**
 * Starts the process of fetching a network request.
 * @function fetch
 * @global
 * @param {String} url - The direct URL of the resource you wish to fetch
 * @param {Object} [init] - Options for the request
 * @param {Headers} [init.headers] Headers to send with the http request
 * @param {string} [init.method=GET] HTTP request method, defaults to `GET`
 * @returns {Promise<Response>} - A {@linkcode Promise} that resolves to a {@linkcode Response} object
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch}
 */
export function fetch(url, init) {
	logger.debug("fetch called", typeof url, typeof init)
	return new Promise(function fetchPromise(resolve, reject) {
		try {
			let req = new Request(url, init)
			url = req.url
			init = {
				method: req.method,
				headers: req.headers && req.headers.toJSON() || {},
			}
			if (!req.bodySource)
				bridge.dispatch("fetch", url, init, null, fetchCb)
			else if (typeof req.bodySource === 'string')
				bridge.dispatch("fetch", url, init, req.bodySource, fetchCb)
			else
				req.arrayBuffer().then(function fetchArrayBufferPromise(body) {
					bridge.dispatch("fetch", url, init, body, fetchCb)
				}).catch(reject)

		} catch (err) {
			logger.debug("err applying nativeFetch", err.toString())
			reject(err)
		}
		function fetchCb(err, nodeRes, nodeBody) {
			if (err)
				return reject(new Error(err))
			resolve(new Response(isFlyStream(nodeBody) ? refToStream(nodeBody) : nodeBody,
				nodeRes))
		}
	})
};

function _applyFetch(url, init, body, cb) {
	// return new Promise(function (resolve, reject) {
	logger.debug("gonna fetch", url, init && JSON.stringify(init))

	bridge.dispatch("fetch", url, init, body, cb)
	logger.debug("dispatched nativefetch")
	// })
}