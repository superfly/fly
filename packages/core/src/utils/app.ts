import log from "../log"

const fromSecretKey = "fromSecret"
const defaultKey = "default"

export function applySecrets(config: any, secrets: any) {
  if (!config) {
    return
  }
  for (const k of Object.keys(config)) {
    if (!!config[k] && typeof config[k] === "object") {
      if (typeof config[k][fromSecretKey] === "string") {
        if (typeof secrets[config[k][fromSecretKey]] !== "undefined") {
          config[k] = secrets[config[k][fromSecretKey]]
        } else {
          log.warn(`Expected secret '${config[k][fromSecretKey]}' to be defined in secrets`)
        }
      } else {
        applySecrets(config[k], secrets)
      }
    }
  }
}

export function findSecretsInConfig(config: any) {
  let secrets: string[] = []

  for (const [key, value] of Object.entries(config)) {
    if (typeof key === "string" && typeof value === "string" && key === fromSecretKey) {
      secrets.push(value)
    } else if (typeof value === "object") {
      secrets.push(...findSecretsInConfig(value))
    }
  }

  return secrets
}
