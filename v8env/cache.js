import { logger } from './logger'

export default function cacheInit(ivm, dispatch) {
	return {
		match(req) {
			logger.debug("cache match")
			return new Promise(function (resolve, reject) {
				dispatch.apply(null, [
					'cacheMatch',
					new ivm.ExternalCopy({
						method: req.method,
						url: req.url,
						headers: req.headers && req.headers.toJSON() || {},
					}).copyInto(),
					new ivm.Reference(function (err, res) {
						logger.debug("cache match got callback", err, res)
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
			logger.debug("cache add")

			return new Promise(function (resolve, reject) {
				req.arrayBuffer()
					.then(function (body) {
						logger.debug("got req body in cache add")
						dispatch.apply(null, [
							'cacheAdd',
							new ivm.ExternalCopy({
								method: req.method,
								url: req.url,
								headers: req.headers && req.headers.toJSON() || {},
							}).copyInto(),
							body && body.byteLength > 0 ?
								new ivm.ExternalCopy(body, {
									transfer: true
								}).copyInto({ transfer: true }) :
								null,
							new ivm.Reference(function (err, res, bodyStr) {
								logger.debug("cache add got callback", err, res)
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
