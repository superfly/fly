import { root, getApp } from './root'
import { API } from './api'

export interface DeployOptions { }
export interface DeployArgs { }

root
  .subCommand<DeployOptions, DeployArgs>("deploy")
  .description("Deploy your local Fly app.")
  .action((opts, args, rest) => {
    const { buildApp } = require('../utils/build')
    const appID = getApp()
    buildApp(process.cwd(), { watch: false }, async (err: Error, code: string, hash: string) => {
      if (err)
        throw err
      const res = await API.patch(`/api/v1/apps/${appID}`, { data: { attributes: { source: code, source_hash: hash } } })
      if (res.status === 200) {
        console.log(`Deploying v${res.data.data.attributes.version} globally, should be updated in a few seconds.`)
      }
    })
  })