const logger = require('../logger')

function backendFetch(req, next) {
	logger.info("backend:", req)
	if (!(this.settings instanceof Object) && !this.settings.backend) {
		return new Response('no backend found', {
			status: 500
		})
	}

	const config = this.settings.get("backend")
	const b = FlyBackend.getBackend(config)
	return b.fetch(req)
}

module.exports = function () {
	registerMiddleware("fly-backend", function () {
		return backendFetch;
	}())
}
