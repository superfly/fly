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
export async function fetch(url, init) {
	logger.debug("fetch called", typeof url, typeof init)
	try {
		let req = new Request(url, init)
		url = req.url
		init = {
			method: req.method,
			headers: req.headers && req.headers.toJSON() || {},
		}
		if (!req.bodySource)
			return await _applyFetch(url, init, null)
		else if (typeof req.bodySource === 'string')
			return await _applyFetch(url, init, req.bodySource)
		return await _applyFetch(url, init, await req.arrayBuffer())

	} catch (err) {
		logger.debug("err applying nativeFetch", err.toString())
		throw err
	}
};

function _applyFetch(url, init, body) {
	return new Promise(function (resolve, reject) {
		logger.debug("gonna fetch", url, init && JSON.stringify(init))

		bridge.dispatch("fetch",
			url, init, body,
			function applyFetchCallback(err, nodeRes, nodeBody) {
				if (err != null) {
					logger.debug("err :(", err)
					reject(err)
					return
				}
				let b = nodeBody;
				logger.debug("is a stream?", isFlyStream(b))
				if (isFlyStream(b))
					b = refToStream(nodeBody)
				resolve(new Response(b, nodeRes))
			}
		)
		logger.debug("dispatched nativefetch")
	})
}