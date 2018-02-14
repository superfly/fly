import { root, getAppId } from './root'
import { API } from './api'
import { getLocalConfig } from '../app/config'
import { processResponse } from '../utils/cli'

export interface DeployOptions { }
export interface DeployArgs { }

root
  .subCommand<DeployOptions, DeployArgs>("deploy")
  .description("Deploy your local Fly app.")
  .action((opts, args, rest) => {
    try {
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
        processResponse(res, (res: any) => {
          console.log(`Deploying v${res.data.data.attributes.version} globally, should be updated in a few seconds.`)
        })
      })
    } catch (e) {
      if (e.response)
        console.log(e.response.data)
      else
        throw e
    }
  })