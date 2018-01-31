import { root, homeConfigPath } from './root'
import { API } from './api'

const promptly = require('promptly')

import path = require('path')
import fs = require('fs-extra')
import YAML = require('js-yaml')

root
  .subCommand<any, any>("login")
  .description("Login to Fly and save credentials locally.")
  .action(async (opts, args, rest) => {
    const email = await promptly.prompt("Email: ")
    const password = await promptly.password("Password: ")
    const otp = await promptly.prompt("2FA code (if any): ", { default: "n/a", retry: false })

    const res = await API.post("/api/v1/sessions", { data: { attributes: { email, password, otp } } })
    if (res.status === 201) {
      const homepath = homeConfigPath()
      const credspath = path.join(homepath, "credentials.yml")
      await fs.writeFile(credspath, YAML.dump({ access_token: res.data.data.attributes.access_token }))
      console.log("Wrote credentials at:", credspath)
    }
  })