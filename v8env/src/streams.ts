/**
 * @module fly
 * @private
 */

/**
 * @hidden
 */
export const
  { ReadableStream } = require('whatwg-streams/reference-implementation/lib/readable-stream'),
  { WritableStream } = require('whatwg-streams/reference-implementation/lib/writable-stream'),
  ByteLengthQueuingStrategy = require('whatwg-streams/reference-implementation/lib/byte-length-queuing-strategy'),
  CountQueuingStrategy = require('whatwg-streams/reference-implementation/lib/count-queuing-strategy'),
  { TransformStream } = require('whatwg-streams/reference-implementation/lib/transform-stream');

/**
 * @hidden
 */
const interfaces = {
  ReadableStream,
  WritableStream,
  ByteLengthQueuingStrategy,
  CountQueuingStrategy,
  TransformStream
};

// Export
/**
 * @hidden
 */
export default interfaces;

// Add classes to window
if (typeof window !== "undefined")
  Object.assign(window, ...Object.keys(interfaces).filter(k => !(k in window)).map(k => ({ [k]: interfaces[k] })));
