const { getContext } = require('./context')

/**
 * Starts the process of fetching a network request.
 * @function fetch
 * @global
 * @param {String} url - The direct URL of the resource you wish to fetch
 * @param {Object} [init] - Options for the request
 * @returns {Promise<Response>} - A {@linkcode Promise} that resolves to a {@linkcode Response} object
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch}
 */
module.exports = function(ivm, dispatch) {
	return async function fetch(url, init) {
		console.log("fetch called", typeof url, typeof init)
		try {
			const backendID = init ? init.backendID : null
			let req = new Request(url, init)
			url = req.url
			init = {
				method: req.method,
				headers: req.headers,
			}
			if (backendID) {
				return await _applyWormholeFetch(dispatch, ivm, backendID, url, init, await req.arrayBuffer())
			}
			return await _applyFetch(url, init, await req.arrayBuffer())

		} catch (err) {
			console.log("err applying nativeFetch", err.toString())
			throw err
		}
	};

	function _applyFetch(url, init, body) {
		return new Promise(function(resolve, reject) {
			console.log("gonna fetch", url, init && JSON.stringify(init))
			dispatch.apply(null, [
        "fetch",
        new ivm.ExternalCopy(getContext())
				.copyInto(),
        url,
        new ivm.ExternalCopy(init)
				.copyInto(),
        new ivm.ExternalCopy(body)
				.copyInto(),
        new ivm.Reference(function(err, nodeRes, nodeBody, proxied) {
					if (err != null) {
						console.log("err :(", err)
						reject(err)
						return
					}
					resolve(new Response(nodeBody, nodeRes.copy(), proxied))
				})
      ])
			console.log("dispatched nativefetch")
		})
	}

	function _applyWormholeFetch(dispatch, ivm, backendID, url, init, body) {
		return new Promise(function(resolve, reject) {
			dispatch.apply(null, [
				"wormholeFetch",
				new ivm.ExternalCopy(getContext())
				.copyInto(),
				backendID,
				url,
				new ivm.ExternalCopy(init)
				.copyInto(),
				new ivm.ExternalCopy(body)
				.copyInto(),
				new ivm.Reference(function(err, nodeRes, nodeBody, proxied) {
					if (err)
						return reject(err)
					resolve(new Response(nodeBody, nodeRes, proxied))
				})
			])
		})
	}

}
