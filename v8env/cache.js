import { logger } from './logger'
import { transferInto } from './utils/buffer'

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
					new ivm.Reference(function (err, res, resBody) {
						logger.debug("cache match got callback", err, res, resBody.toString())
						if (err)
							return reject(err)
						if (res)
							return resolve(new Response(resBody, res))
						resolve()
					})
				])
			})
		},

		async add(req) {
			logger.debug("cache add")

			const res = await fetch(req)
			return await cache.put(req, res)
		},

		put(req, res) {
			logger.debug("cache put called", req instanceof Request, res instanceof Response)
			return new Promise(function (resolve, reject) {
				res.arrayBuffer().then((body) => {
					dispatch.apply(null, [
						'cachePut',
						new ivm.ExternalCopy({
							method: req.method,
							url: req.url,
							headers: req.headers && req.headers.toJSON() || {},
						}).copyInto(),
						new ivm.ExternalCopy({
							status: res.status,
							headers: res.headers && res.headers.toJSON() || {},
						}).copyInto(),
						transferInto(ivm, body),
						new ivm.Reference(function (err) {
							logger.debug("cache put got callback", err)
							if (err)
								return reject(err)
							resolve()
						})
					])
				}).catch(reject)
			})
		}
	}
}
