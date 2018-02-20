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
export default function fetchInit(ivm, dispatch) {
	return async function fetch(url, init) {
		logger.debug("fetch called", typeof url, typeof init)
		try {
			let req = new Request(url, init)
			url = req.url
			init = {
				method: req.method,
				headers: req.headers && req.headers.toJSON() || {},
			}
			console.log("INIT:", init)
			return await _applyFetch(url, init, await req.arrayBuffer())

		} catch (err) {
			logger.debug("err applying nativeFetch", err.toString())
			throw err
		}
	};

	function _applyFetch(url, init, body) {
		return new Promise(function (resolve, reject) {
			const initCopy = new ivm.ExternalCopy(init)
			const cbRef = new ivm.Reference(function (err, nodeRes, nodeBody) {
				if (err != null) {
					logger.debug("err :(", err)
					reject(err)
					return
				}
				resolve(new Response(nodeBody, nodeRes.copy()))
			})
			global.disposables.push(cbRef)
			logger.debug("gonna fetch", url, init && JSON.stringify(init))
			dispatch.apply(null, [
				"fetch",
				url,
				initCopy.copyInto(),
				transferInto(ivm, body),
				cbRef
			])
			logger.debug("dispatched nativefetch")
		})
	}


}
