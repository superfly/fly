import { logger } from './logger'
import CachePolicy from 'http-cache-semantics'

/**
 * export:
 * 	match(req): res | null
 * 	add(req): void
 * 	put(req, res): void
 */

export default {
	async match(req) {
		const hashed = hashData(req)
		let key = "httpcache:policy:" + hashed // first try with no vary variant
		for (let i = 0; i < 5; i++) {
			const policyRaw = await fly.cache.getString(key)
			logger.debug("Got policy:", key, policyRaw)
			if (!policyRaw) {
				return undefined
			}
			const policy = CachePolicy.fromObject(JSON.parse(policyRaw))

			// if it fits i sits
			if (policy.satisfiesWithoutRevalidation(req)) {
				const headers = policy.responseHeaders()
				const bodyKey = "httpcache:body:" + hashed

				const body = await fly.cache.get(bodyKey)
				logger.debug("Got body", body.constructor.name, body.byteLength)
				return new Response(body, { status: policy._status, headers: headers })
				//}else if(policy._headers){
				// TODO: try a new vary based key
				// policy._headers has the varies / vary values
				// key = hashData(req, policy._headers)
				//return undefined
			} else {
				return undefined
			}
		}
		return undefined // no matches found
	},
	async add(req) {
		logger.debug("cache add")

		const res = await fetch(req)
		return await cache.put(req, res)
	},
	async put(req, res) {
		const resHeaders = {}
		const key = hashData(req)

		for (const h of res.headers) {
			if (h[0] === 'set-cookie')
				resHeaders[h[0]] = h[1]
			else
				resHeaders[h[0]] = h[1].join && h[1].join(',') || h[1]
		}
		let cacheableRes = {
			status: res.status,
			headers: resHeaders,
		}
		const policy = new CachePolicy({
			url: req.url,
			method: req.method,
			headers: req.headers || {},
		}, cacheableRes)

		const ttl = Math.floor(policy.timeToLive() / 1000)
		if (policy.storable() && ttl > 0) {
			logger.debug("Setting cache policy:", "httpcache:policy:" + key)
			await fly.cache.set("httpcache:policy:" + key, JSON.stringify(policy.toObject()), ttl)
			const respBody = await res.arrayBuffer()
			await fly.cache.set("httpcache:body:" + key, respBody, ttl)
		}
	}
}

function hashData(req, vary) {
	let toHash = ``

	const u = normalizeURL(req.url)

	toHash += u.toString()
	toHash += req.method

	// TODO: cacheable cookies
	// TODO: cache version for grand busting

	logger.debug("hashData", toHash)
	return fly.util.md5.hash(toHash)
}

function normalizeURL(u) {
	let url = new URL(u)
	url.hash = ""
	const sp = url.searchParams
	sp.sort()
	url.search = sp.toString()

	return url
}