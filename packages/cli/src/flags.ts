import { flags } from "@oclif/command"

export const env = flags.build({
  name: "env",
  description: "environment to use for commands",
  default: () => process.env.FLY_ENV || process.env.NODE_ENV || "development"
})

export const app = flags.build({
  name: "app",
  char: "a",
  description: "the app to run commands against",
  env: "FLY_APP_NAME"
})
