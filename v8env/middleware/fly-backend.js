function backendFetch(req, next) {
	if (!(this.settings instanceof Object) && !this.settings.backend) {
		return new Response('no backend found', {
			status: 500
		})
	}

	const b = FlyBackend.getBackend(this.settings.get("backend"))
	return b.fetch(req)
}

module.exports = function() {
	registerMiddleware("fly-backend", function() {
		return backendFetch;
	}())
}
