// Console
export const console = {
	log(...args) {
		fly.log('info', ...args)
	},
	info(...args) {
		fly.log('info', ...args)
	},
	assert(assertion, ...args) {
		if (!assertion)
			fly.log('info', ...args)
	},
	error(...args) {
		fly.log('error', ...args)
	},
	exception(...args) {
		fly.log('error', ...args)
	},
	warn(...args) {
		fly.log('warn', ...args)
	},
	trace() {
		let stack = new Error().stack.match(/[^\r\n]+/g)
		fly.log('info', "Trace:\n" + stack.slice(2).join("\n"))
	},

	// off-spec
	debug(...args) {
		fly.log('debug', ...args)
	},

	// unimplemented
	clear: noop,
	count: noop,
	dir: noop,
	dirxml: noop,
	group: noop,
	groupCollapsed: noop,
	groupEnd: noop,
	timestamp: noop,

	// TODO: Implement
	profile: noop,
	profileEnd: noop,
	table: noop,
	time: noop,
	timeEnd: noop,
}

function noop() { }