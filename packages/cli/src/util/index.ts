export const fullAppMatch = /^([a-z0-9_-]+)$/i

export function isValidAppName(name: string): boolean {
  if (!name) {
    return false
  }
  return fullAppMatch.test(name)
}

export function formatRuntime(runtime: string): string {
  switch (runtime) {
    case "FIRECRACKER":
      return "Container"
    case "NODEPROXY":
      return "JavaScript"
  }
  return "Unknown"
}
