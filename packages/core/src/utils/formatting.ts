/**
 * Format a high-resolution real time as duration in milliseconds
 */
export function formatDuration(start: [number, number]) {
  const end = process.hrtime(start)
  return `${((end[0] * 1e9 + end[1]) / 1e6).toFixed(2)}ms`
}

export function formatByteLength(bytes: number) {
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return ((bytes / Math.pow(1024, i)).toFixed(2) as any) + ["B", "KB", "MB", "GB", "TB"][i]
}
