const { getContext } = require("../context")

module.exports = function(ivm, dispatch) {

	registerMiddleware("wormhole-fetch", async function(req) {
		const backend = getBackendByID(this.settings.get("backendID"))
		let url = req.url
		let init = {
			method: req.method,
			headers: req.headers,
		}
		if (!backend) {
			return new Response('', {
				status: 404
			})
		}

		return Middleware.run("fly-backend", { backend: backend }, req)
	})

	function getBackendByID(id) {
		if (!(global.backends instanceof Array)) {
			return null
		}
		return global.backends.find((backend) => {
			return backend.id == id
		})
	}
}
