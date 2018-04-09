import fs = require('fs')
import { root, getAppName } from './root'
import { API } from './api'
import { processResponse } from '../utils/cli'
import { COMMAND, OPTION } from './argTypes'

export interface SecretSetOptions {
  filename?: string[]
}
export interface SecretSetArgs {
  key: string,
  value?: string
}

root.add([{
  type: COMMAND,
  name: "secrets",
  description: "Manage your Fly app secrets.",
  action: () => null
},
{
  type: COMMAND,
  name: 'set',
  dontShow: true,
  description: "Set a secret to use in your config.",
  usage: "fly secrets set <key> [value]",
  takesArguments: true,
  mapTo: 'key',
  action: async () => {
    try {
      const appName = getAppName()
      const opts = root.getOptions(false)
      const value = opts.filename ?
        fs.readFileSync(opts.filename).toString() :
        opts.key

      if (!value)
        throw new Error("Either a value or --from-file needs to be provided.")

      const res = await API.patch(`/api/v1/apps/${appName}/secrets`, {
        data: {
          attributes: {
            key: opts.key,
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
  }
},
{
  type: OPTION,
  name: 'from-file',
  dontShow: true,
  mapTo: 'filename',
  description: "Use a file's contents as the secret value.",
}])
