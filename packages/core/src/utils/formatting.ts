/**
 * Format a high-resolution real time as duration in milliseconds
 */
export function formatDuration(start: [number, number]) {
  const end = process.hrtime(start)
  return `${((end[0] * 1e9 + end[1]) / 1e6).toFixed(2)}ms`
}
