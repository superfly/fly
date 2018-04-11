import { root, homeConfigPath } from './root'
import axios from 'axios'
import { processResponse } from '../utils/cli'
import { COMMAND, OPTION } from './argTypes'

const promptly = require('promptly')

import path = require('path')
import fs = require('fs-extra')
import YAML = require('js-yaml')

const baseURL = process.env.FLY_BASE_URL || "https://fly.io"

root.add([{
  type: COMMAND,
  name: 'login',
  description: "Login to Fly and save credentials locally.",
  action: async () => {
    const email = await promptly.prompt("Email: ")
    const password = await promptly.password("Password: ")
    const otp = await promptly.prompt("2FA code (if any): ", { default: "n/a", retry: false })
    try {

      const res = await axios.post(`${baseURL}/api/v1/sessions`, { data: { attributes: { email, password, otp } } })
      processResponse(res, (res: any) => {
        const homepath = homeConfigPath()
        const credspath = path.join(homepath, "credentials.yml")
        fs.writeFileSync(credspath, YAML.dump({ access_token: res.data.data.attributes.access_token }))
        console.log("Wrote credentials at:", credspath)
      })
    } catch (e) {
      if (e.response)
        console.log(e.response.data)
      else
        throw e
    }
  }
}])
