/**
 * Starts the process of fetching a network request.
 * @function fetch
 * @global
 * @param {String} url - The direct URL of the resource you wish to fetch
 * @param {Object} [init] - Options for the request
 * @returns {Promise<Response>} - A {@linkcode Promise} that resolves to a {@linkcode Response} object
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch}
 */
module.exports = function (ivm, dispatch) {
	return async function fetch(url, init) {
		console.debug("fetch called", typeof url, typeof init)
		try {
			let req = new Request(url, init)
			url = req.url
			init = {
				method: req.method,
				headers: req.headers,
			}
			return await _applyFetch(url, init, await req.arrayBuffer())

		} catch (err) {
			console.debug("err applying nativeFetch", err.toString())
			throw err
		}
	};

	function _applyFetch(url, init, body) {
		return new Promise(function (resolve, reject) {
			console.debug("gonna fetch", url, init && JSON.stringify(init))
			dispatch.apply(null, [
				"fetch",
				url,
				new ivm.ExternalCopy(init).copyInto(),
				new ivm.ExternalCopy(body).copyInto(),
				new ivm.Reference(function (err, nodeRes, nodeBody, proxied) {
					if (err != null) {
						console.debug("err :(", err)
						reject(err)
						return
					}
					resolve(new Response(nodeBody, nodeRes.copy(), proxied))
				})
			])
			console.debug("dispatched nativefetch")
		})
	}
}
