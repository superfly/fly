import fs = require('fs')
import { root, getAppId } from './root'
import { API } from './api'

export interface SecretSetOptions {
  filename?: string[]
}
export interface SecretSetArgs {
  key: string,
  value?: string
}

const secrets = root
  .subCommand<any, any>("secrets")
  .description("Manage your Fly app secrets.")

secrets
  .subCommand<SecretSetOptions, SecretSetArgs>("set <key> [value]")
  .description("Set a secret to use in your config.")
  .option("--from-file <filename>", "Use a file's contents as the secret value.")
  .action(async (opts, args, rest) => {
    const appID = getAppId()

    const value = opts.filename ?
      fs.readFileSync(opts.filename[0]).toString() :
      args.value && args.value

    if (!value)
      throw new Error("Either a value or --from-file needs to be provided.")

    const res = await API.patch(`/api/v1/apps/${appID}/secrets`, {
      data: {
        attributes: {
          key: args.key,
          value: Buffer.from(value).toString('base64')
        }
      }
    })
    if (res.status === 200) {
      console.log(`Deploying v${res.data.data.attributes.version} globally, should be updated in a few seconds.`)
    }
  })