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

		if(breq.url == req.url){
			return new Response("Can't do recursive proxy", {status: 500})
		}

		breq.headers.delete('accept-encoding')
		setRequestHeaders(req, breq, this.headers)
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

function setRequestHeaders(req, breq, headers) {
	if (global.overrideHost) {
		breq.headers.set('host', global.overrideHost)
		breq.headers.set('x-forwarded-host', global.overrideHost)
	}
	let url = urlParse(req.url)
	breq.headers.set('x-forwarded-proto', url.protocol.slice(0, url.protocol.length - 1))
	breq.headers.set('x-forwarded-for', req.remoteAddr)

	for (const k in headers) {
		if (headers[k] === false) {
			if (k == 'host') {
				breq.headers.set(k, '')
			} else {
				breq.headers.delete(k)
			}
		} else {
			breq.headers.set(k, headers[k])
		}
	}
}
