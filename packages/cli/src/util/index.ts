export const fullAppMatch = /^([a-z0-9_-]+)$/i

export function isValidAppName(name: string): boolean {
  if (!name) {
    return false
  }
  return fullAppMatch.test(name)
}
