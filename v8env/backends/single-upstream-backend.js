const urlParse = require("url-parse")

export class SingleUpstreamBackend {
	constructor(props) {
		this.upstreamScheme = props.upstream_scheme || "http"
		this.upstream = props.upstream
		this.headers = props.headers || {}
	}

	fetch(req) {
		let breq = new Request(req) // don't want to munge the existing one
		let url = urlParse(breq.url)
		url = setBackendURL(this, url)
		breq.url = url.toString()

		breq.headers.delete('accept-encoding')
		setRequestHeaders(breq, url, this.headers)
		return global.fetch(breq)
	}
}

function setBackendURL(backend, url) {
	const backendUrl = urlParse(backend.upstreamScheme + "://" + backend.upstream)

	url.protocol = backendUrl.protocol
	url.host = backendUrl.host
	url.hostname = backendUrl.hostname
	url.port = backendUrl.port

	return url
}

function setRequestHeaders(req, url, headers) {
	if (global.overrideHost) {
		req.headers.set('host', global.overrideHost)
		req.headers.set('x-forwarded-host', global.overrideHost)
	}
	req.headers.set('x-forwarded-proto', url.protocol.slice(0, url.protocol.length - 1))
	req.headers.set('x-forwarded-for', req.remoteAddr)

	for (const k in headers) {
		if (headers[k] === false) {
			if (k == 'host') {
				req.headers.set(k, '')
			} else {
				req.headers.delete(k)
			}
		} else {
			req.headers.set(k, headers[k])
		}
	}
}
