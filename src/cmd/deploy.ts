import { root, getAppId } from './root'
import { API } from './api'
import { getLocalConfig } from '../app/config'

export interface DeployOptions { }
export interface DeployArgs { }

root
  .subCommand<DeployOptions, DeployArgs>("deploy")
  .description("Deploy your local Fly app.")
  .action((opts, args, rest) => {
    const { buildApp } = require('../utils/build')
    const appID = getAppId("production")
    console.log("Deploying", appID)
    buildApp(process.cwd(), { watch: false, uglify: true }, async (err: Error, source: string, hash: string, sourceMap: string) => {
      if (err)
        throw err
      const res = await API.post(`/api/v1/apps/${appID}/releases`, {
        data: {
          attributes: {
            source: source,
            source_hash: hash,
            // source_map: sourceMap,
            config: getLocalConfig(process.cwd(), "production")
          }
        }
      })
      if (res.status === 200) {
        console.log(`Deploying v${res.data.data.attributes.version} globally, should be updated in a few seconds.`)
      }
    })
  })