import { getLocalRelease } from "@fly/core/lib/utils/local"

export const fullAppMatch = /^([a-z0-9_-]+)$/i

export function isValidAppName(name: string): boolean {
  if (!name) {
    return false
  }
  return fullAppMatch.test(name)
}

export function getAppName(flags: { app?: string; cwd?: string; env?: string }) {
  let { app, cwd } = flags

  if (!cwd) {
    cwd = process.cwd()
  }

  if (!app) {
    if (!flags.env) {
      throw new Error("--env option or FLY_ENV variable needs to be set.")
    }
    const release = getLocalRelease(cwd, flags.env, { noWatch: true })
    app = release.getConfig().app
  }

  if (!app) {
    throw new Error("--app option or app (in your .fly.yml) needs to be set.")
  }

  if (!isValidAppName(app)) {
    throw new Error(`${app} is not a valid app name`)
  }

  return app
}
