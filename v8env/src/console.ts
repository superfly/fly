/**
 * @module fly
 * @private
 */
declare var fly: any

// Console
export const console: Console = {
	// TODO: adding junk to conform to merged Console interface from node & lib.dom
	memory: undefined,
	markTimeline: undefined,
	msIsIndependentlyComposed: undefined,
	select: undefined,
	timeStamp: undefined,
	timeline: undefined,
	timelineEnd: undefined,
	Console: undefined,

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
	// TODO: commenting out to resolve definition conflict between @types/node & lib.dom
	//  see: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/v4/index.d.ts#L15
	//  note: 'timestamp' here & 'timeStamp' above...
	// timestamp: noop,

	// TODO: Implement
	profile: noop,
	profileEnd: noop,
	table: noop,
	time: noop,
	timeEnd: noop,
}

function noop() { }