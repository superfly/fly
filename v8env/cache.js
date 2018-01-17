module.exports = function (ivm, dispatch) {

	return {
		match(req) {
			console.debug("cache match")
			return new Promise(function (resolve, reject) {
				dispatch.apply(null, [
					'cacheMatch',
					new ivm.ExternalCopy({
						method: req.method,
						url: req.url,
						headers: req.headers || {},
					}).copyInto(),
					new ivm.Reference(function (err, res) {
						console.debug("cache match got callback", err, res)
						if (err)
							return reject(err)
						if (res)
							return resolve(new Response(res.body, res))
						resolve()
						return
					})
				])
			})
		},
		add(req) {
			console.debug("cache add")

			return new Promise(function (resolve, reject) {
				req.arrayBuffer()
					.then(function (body) {
						console.debug("got req body in cache add")
						dispatch.apply(null, [
							'cacheAdd',
							new ivm.ExternalCopy({
								method: req.method,
								url: req.url,
								headers: req.headers,
							}).copyInto(),
							new ivm.ExternalCopy(body)
								.copyInto(),
							new ivm.Reference(function (err, res, bodyStr) {
								console.debug("cache add got callback", err, res)
								if (err)
									return reject(err)
								if (res)
									return resolve(new Response(bodyStr, res))
								resolve()
							})
						])
					})
					.catch(reject)
			})
		}
	}
}
