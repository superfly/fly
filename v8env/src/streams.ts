/**
 * @module fly
 * @private
 */

/**
 * @hidden
 */
import * as Streams from '@mattiasbuelens/web-streams-polyfill'

/**
 * @hidden
 */
export class ReadableStream extends Streams.ReadableStream {
    flyStreamId?: number
}

/**
 * @hidden
 */
export const {
    WritableStream,
    ByteLengthQueuingStrategy,
    CountQueuingStrategy,
    TransformStream
} = Streams
