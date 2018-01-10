export class WormholeBackend {
	constructor(props) {
		this.id = props.id
	}

	fetch(req) {
		return global.fetch(req, { backendID: this.id })
	}
}
