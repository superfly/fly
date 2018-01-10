const { SingleUpstreamBackend } = require("./backends/single-upstream-backend")
const { WormholeBackend } = require("./backends/wormhole-backend")

export class FlyBackend {
	static getBackend(backend) {
		if (backend.is_multi_upstream) {
			return new WormholeBackend(backend)
		}
		return new SingleUpstreamBackend(backend)
	}
}
