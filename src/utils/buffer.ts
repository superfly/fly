import { Duplex } from 'stream';
import { ivm } from '..';

export function bufferToStream(buffer: Buffer) {
  let stream = new Duplex();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

export function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset, buffer.byteOffset + buffer.byteLength
  )
}

export function transferInto(buffer: Buffer | ArrayBuffer | null) {
  if (!buffer)
    return null
  if (buffer instanceof Buffer)
    return (new ivm.ExternalCopy(bufferToArrayBuffer(buffer), { transferOut: buffer.byteLength > 0 })).copyInto({ transferIn: true });
  else if (buffer instanceof ArrayBuffer)
    return (new ivm.ExternalCopy(buffer, { transferOut: buffer.byteLength > 0 })).copyInto({ transferIn: true });
}