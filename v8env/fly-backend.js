import { SingleUpstreamBackend } from "./backends/single-upstream-backend"

export class FlyBackend {
	static getBackend(backend) {
		return new SingleUpstreamBackend(backend)
	}
}