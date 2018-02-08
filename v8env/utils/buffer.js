export function transferInto(ivm, buffer) {
  if (!buffer)
    return null
  return (new ivm.ExternalCopy(buffer, { transferOut: buffer.byteLength > 0 })).copyInto({ transferIn: true });
}