// tslint:disable:no-shadowed-variable

import { FlyCommand } from "../../base-command"
import { apiClient } from "../../api"
import { processResponse } from "cli/src/api"
import { isValidAppName, fullAppMatch } from "cli/src/util"
import { existsSync, writeFileSync } from "fs"

export default class Create extends FlyCommand {
  static description = `create a new app`

  static args = [
    {
      name: "app-name",
      description: "Unique name for the new app. Allowed characters are [a-z0-9-_.], will be lowercased",
      required: true
    }
  ]

  public async run() {
    const { flags, argv } = this.parse(this.ctor)

    const API = apiClient(this)

    const name = argv[0]

    if (!isValidAppName(name)) {
      throw new Error(`App name must match regex: ${fullAppMatch}`)
    }

    const res = await API.post(`/api/v1/apps`, { data: { attributes: { name } } })

    processResponse(this, res, () => {
      this.log(`App ${res.data.data.attributes.name} created!`)
      if (existsSync(".fly.yml")) {
        this.log(`Add it to your .fly.yml like: \`app: ${res.data.data.attributes.name}\``)
      } else {
        writeFileSync(".fly.yml", `app: ${res.data.data.attributes.name}`)
        this.log("Created a .fly.yml for you.")
      }
    })
  }
}
