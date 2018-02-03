import { LogEvent, dispatchEvent } from './events'
import { format } from 'util'

// Console
export default function consoleInit(ivm) {
	// function nodeLog(...args) {
	// 	global._log.apply(undefined, args.map(arg => new ivm.ExternalCopy(arg)
	// 		.copyInto()));
	// }

	const Console = {
		log(...args) {
			Console.info(...args)
		},
		info(...args) {
			dispatchEvent(new LogEvent('log', { level: 'info', message: format(...args), timestamp: new Date }))
		},
		assert(assertion, ...args) {
			if (!assertion)
				Console.info(...args)
		},
		error(...args) {
			dispatchEvent(new LogEvent('log', { level: 'error', message: format(...args), timestamp: new Date }))
		},
		exception(...args) {
			Console.error(...args)
		},
		warn(...args) {
			dispatchEvent(new LogEvent('log', { level: 'warn', message: format(...args), timestamp: new Date }))
		},
		trace() {
			let stack = new Error().stack.match(/[^\r\n]+/g)
			Console.info("Trace:\n" + stack.slice(2).join("\n"))
		},

		// off-spec
		debug(...args) {
			dispatchEvent(new LogEvent('log', { level: 'debug', message: format(...args), timestamp: new Date }))
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

