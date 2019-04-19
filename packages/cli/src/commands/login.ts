import { FlyCommand } from "../base-command"
import { processResponse } from "../api"
import { cli } from "cli-ux"
import axios from "axios"
import { storeCredentials, credentialsPath, storeNetrcCredentials } from "../credentials"

const baseURL = process.env.FLY_BASE_URL || "https://fly.io"

export default class Login extends FlyCommand {
  static description = `login to fly`

  static flags = {}

  static args = []

  public async run() {
    const email = await cli.prompt("email")
    const password = await cli.prompt("password", { type: "hide" })
    const otp = await cli.prompt("2FA code (if any)", { default: "n/a", required: false })
    const res = await axios.post(`${baseURL}/api/v1/sessions`, {
      data: { attributes: { email, password, otp } }
    })

    processResponse(this, res, () => {
      const access_token = res.data.data.attributes.access_token
      storeCredentials({ access_token })
      storeNetrcCredentials("git.fly.io", access_token)
      console.log("Wrote credentials at:", credentialsPath())
    })
  }
}
