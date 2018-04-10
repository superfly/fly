/**
 * @private
 * @module fly
 * @hidden
 */
export function transferInto(ivm: any, buffer: BufferSource) {
  if (!buffer)
    return null
  return new ivm.ExternalCopy(buffer).copyInto({ release: true });
}