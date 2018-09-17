import axios from "axios"
import { getToken, CommonOptions } from "./root"
import { Command } from "commandpost"

const { version } = require("../../package.json")

export function apiClient(cmd: Command<CommonOptions, any>) {
  const baseURL = process.env.FLY_BASE_URL || "https://fly.io"

  return axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      Authorization: `Bearer ${getToken(cmd)}`,
      "User-Agent": `fly/${version}`
    },
    validateStatus: status => {
      return status >= 200 && status < 500
    }
  })
}
