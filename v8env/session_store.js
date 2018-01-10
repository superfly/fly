class SessionStore {
	constructor() {
		this.session = {};
	}

	get(key) {
		return this.session[key]
	}

	set(key, value) {
		this.session[key] = value
	}
}

module.exports = SessionStore
