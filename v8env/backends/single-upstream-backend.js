const urlParse = require("url-parse")

export class SingleUpstreamBackend {
	constructor(props) {
		this.upstreamScheme = props.upstream_scheme || "http"
		this.upstream = props.upstream
		this.headers = props.headers || {}
	}

	fetch(req) {
		let url = urlParse(req.url)
		url = setBackendURL(this, url)
		req.url = url.toString()

		req.headers.delete('accept-encoding')
		setRequestHeaders(req, this.headers)
		return global.fetch(req)
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

function setRequestHeaders(req, headers) {
	if (global.overrideHost) {
		req.headers.set('host', global.overrideHost)
		req.headers.set('x-forwarded-host', global.overrideHost)
	}
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
