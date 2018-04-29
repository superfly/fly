import fs = require('fs')
import { root, getAppName, CommonOptions, addCommonOptions } from './root'
import { apiClient } from './api'
import { processResponse } from '../utils/cli'
import { Command } from 'commandpost';

export interface SecretSetOptions extends CommonOptions {
  filename?: string[]
}
export interface SecretSetArgs {
  key: string,
  value?: string
}

function addSubCommands(instance: Command<CommonOptions, any>) {
  instance
    .subCommand<SecretSetOptions, SecretSetArgs>("set <key> [value]")
    .description("Set a secret to use in your config.")
    .option("--from-file <filename>", "Use a file's contents as the secret value.")
    .usage("fly secrets set <key> [value]")
    .action(async function (this: Command<SecretSetOptions, SecretSetArgs>, opts, args, rest) {
      const API = apiClient(this)
      try {
        const appName = getAppName(this, { env: ['production'] })

        const value = opts.filename ?
          fs.readFileSync(opts.filename[0]).toString() :
          args.value && args.value

        if (!value)
          throw new Error("Either a value or --from-file needs to be provided.")

        const res = await API.patch(`/api/v1/apps/${appName}/secrets`, {
          data: {
            attributes: {
              key: args.key,
              value: Buffer.from(value).toString('base64')
            }
          }
        })
        processResponse(res, (res: any) => {
          console.log(`Deploying v${res.data.data.attributes.version} globally, should be updated in a few seconds.`)
        })
      } catch (e) {
        if (e.response)
          console.log(e.response.data)
        else
          throw e
      }
    })

  return instance
}

const secrets: Command<CommonOptions, any> = root
  .subCommand<any, any>("secrets")
  .description("Manage your Fly app secrets.")

/* I think we'd much rather have aliases not be displayed in the Commands list going forward. This will require a hack of the `commandpost` package which I also think I can do, having read their source code. Basically just extend their main class to include an `alias` function (e.g. `.alias('env')`) function that adds another subcommand sans-description, or adds more params to `.subCommand`. We can do that without making changes to their repo I think. */
const secret: Command<CommonOptions, any> = root
  .subCommand<any, any>("secret")
  .description("Alias for 'secrets' command.")

const secretSet = addSubCommands(secret)
const secretsSet = addSubCommands(secrets)

addCommonOptions(secrets)
addCommonOptions(secretsSet)
addCommonOptions(secret)
addCommonOptions(secretSet)