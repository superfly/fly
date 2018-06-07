import { Duplex } from 'stream';
import { ivm } from '..';

export function bufferToStream(buffer: Buffer) {
  let stream = new Duplex();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

export function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer | SharedArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset, buffer.byteOffset + buffer.byteLength
  )
}

export function transferInto(buffer: Buffer | ArrayBuffer | TypedArray | null): ivm.Copy<ArrayBuffer> | null {
  if (!buffer)
    return null
  if (buffer instanceof Buffer)
    return transferArrayBufferInto(bufferToArrayBuffer(buffer))
  else if (buffer instanceof ArrayBuffer || typeof buffer.buffer !== 'undefined')
    return transferArrayBufferInto(buffer)
  return new ivm.ExternalCopy(buffer).copyInto({ release: true })
}

function transferArrayBufferInto(buffer: ArrayBuffer | SharedArrayBuffer | TypedArray) {
  return new ivm.ExternalCopy(buffer, { transferOut: true }).copyInto({ release: true, transferIn: true });
}