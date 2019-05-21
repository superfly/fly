import { flags } from "@oclif/command"
import { getSavedAccessToken } from "./credentials"

export const env = flags.build({
  name: "env",
  description: "environment to use for commands",
  default: () => process.env.FLY_ENV || process.env.NODE_ENV || "development"
})

export const app = flags.build({
  name: "app",
  char: "a",
  description: "The app to run commands against",
  env: "FLY_APP_NAME"
})

export const apiToken = flags.build({
  name: "token",
  description: "The api token to use. This will override the token created with `fly login` if present.",
  env: "FLY_ACCESS_TOKEN"
})
