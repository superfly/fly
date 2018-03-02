export function transferInto(ivm, buffer) {
  if (!buffer)
    return null
  return new ivm.ExternalCopy(buffer).copyInto({ release: true });
}