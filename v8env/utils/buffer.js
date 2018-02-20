export function transferInto(ivm, buffer) {
  if (!buffer)
    return null
  const extCopy = new ivm.ExternalCopy(buffer, { transferOut: buffer.byteLength > 0 })
  global.disposables.push(extCopy) // not sure if needed or even harmful
  return extCopy.copyInto({ transferIn: true });
}