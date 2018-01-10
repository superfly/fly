// Console
module.exports = function (ivm) {
	let nodeLog = function (nativeLog) {
		return function (...args) {
			nativeLog.apply(undefined, args.map(arg => new ivm.ExternalCopy(arg)
				.copyInto()));
		}
	}(global._log)
	delete global._log;

	const Console = {
		log(...args) {
			Console.info(...args)
		},
		info(...args) {
			nodeLog('info', ...args)
		},
		assert(assertion, ...args) {
			if (!assertion)
				Console.info(...args)
		},
		error(...args) {
			nodeLog('error', ...args)
		},
		exception(...args) {
			Console.error(...args)
		},
		warn(...args) {
			nodeLog('warn', ...args)
		},
		trace() {
			let stack = new Error().stack.match(/[^\r\n]+/g)
			Console.info("Trace:\n" + stack.slice(2).join("\n"))
		},

		// off-spec
		debug(...args) {
			nodeLog('debug', ...args)
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
	return Console
}

function noop() { }

