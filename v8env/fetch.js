import { logger } from './logger'
import { transferInto } from './utils/buffer'

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
export default function fetchInit(ivm, dispatcher) {
	return async function fetch(url, init) {
		logger.debug("fetch called", typeof url, typeof init)
		try {
			let req = new Request(url, init)
			url = req.url
			init = {
				method: req.method,
				headers: req.headers && req.headers.toJSON() || {},
			}
			return await _applyFetch(url, init, await req.arrayBuffer())

		} catch (err) {
			logger.debug("err applying nativeFetch", err.toString())
			throw err
		}
	};

	function _applyFetch(url, init, body) {
		return new Promise(function (resolve, reject) {
			logger.debug("gonna fetch", url, init && JSON.stringify(init))
			const cb = new ivm.Reference(function _applyFetchCallback(err, nodeRes, nodeBody) {
				cb.release()
				if (err != null) {
					logger.debug("err :(", err)
					reject(err)
					return
				}
				const b = fly.streams.refToStream(nodeBody)
				resolve(new Response(b, nodeRes))
			})
			dispatcher.dispatch("fetch",
				url,
				new ivm.ExternalCopy(init).copyInto({ release: true }),
				transferInto(ivm, body),
				cb
			).catch((err) => {
				try { cb.release() } catch (e) { }
				reject(err)
			})
			logger.debug("dispatched nativefetch")
		})
	}

}
