const { SingleUpstreamBackend } = require("./backends/single-upstream-backend")

export class FlyBackend {
	static getBackend(backend) {
		return new SingleUpstreamBackend(backend)
	}
}
