import { root, getAppName, CommonOptions, addCommonOptions, getEnv } from './root'
import { apiClient } from './api'
import { getLocalRelease } from '../utils/local'
import { processResponse } from '../utils/cli'

import log from '../log'

import * as tar from 'tar-fs'
import * as glob from 'glob'
import { Readable } from 'stream';
import { createWriteStream, readFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';

import * as pako from 'pako'
import { AxiosResponse } from 'axios';
import { Command } from 'commandpost';
import { resolve as pathResolve } from 'path';

export interface DeployOptions extends CommonOptions { }
export interface DeployArgs {
  path?: string
}

const deploy = root
  .subCommand<DeployOptions, DeployArgs>("deploy [path]")
  .description("Deploy your local Fly app.")
  .action(function (this: Command<DeployOptions, DeployArgs>, opts, args, rest) {
    const API = apiClient(this)
    const { buildApp } = require('../utils/build')
    const env = getEnv(this)
    const cwd = args.path || process.cwd()
    const appName = getAppName(this, cwd)

    console.log("Deploying", appName, `(env: ${env})`)

    const release = getLocalRelease(cwd, env, { noWatch: true })

    buildApp(cwd, { watch: false, uglify: true }, async (err: Error, source: string, hash: string, sourceMap: string) => {
      // look for generated config
      const configPath = existsSync(pathResolve(".fly", ".fly.yml")) ? ".fly/.fly.yml" : ".fly.yml"
      try {
        const entries = [
          configPath, // processed .fly.yml
          ...glob.sync('.fly/*/**.{js,json}', { cwd: cwd }),
          ...release.files
        ].filter((f) => existsSync(pathResolve(cwd, f)))

        const res = await new Promise<AxiosResponse<any>>((resolve, reject) => {
          tar.pack(cwd, {
            entries: entries,
            map: (header) => {
              if (header.name === ".fly/.fly.yml") {
                // use generated .fly.yml as config (for globbing)
                header.name = ".fly.yml"
              }
              return header
            },
            dereference: true,
            finish: function () {
              log.debug("Finished packing.")
              const buf = readFileSync(pathResolve(cwd, '.fly/bundle.tar'))
              console.log(`Bundle size: ${buf.byteLength / (1024 * 1024)}MB`)
              const gz = pako.gzip(buf)
              console.log(`Bundle compressed size: ${gz.byteLength / (1024 * 1024)}MB`)
              const hash = createHash("sha1") // we need to verify the upload is :+1:
              hash.update(buf)

              const res = API.post(`/api/v1/apps/${appName}/releases`, gz, {
                params: {
                  sha1: hash.digest('hex'),
                  env: env,
                },
                headers: {
                  'Content-Type': 'application/x-tar',
                  'Content-Length': gz.byteLength,
                  'Content-Encoding': 'gzip'
                },
                maxContentLength: 100 * 1024 * 1024,
                timeout: 120 * 1000
              }).then(resolve).catch(reject)
            },
          }).pipe(createWriteStream(pathResolve(cwd, '.fly/bundle.tar')))
        })

        processResponse(res, (res: any) => {
          console.log(`Deploying v${res.data.data.attributes.version} globally @ https://${appName}.edgeapp.net`)
          console.log(`App should be updated in a few seconds.`)
        })

      } catch (e) {
        if (e.response)
          console.log(e.response.data)
        else {
          throw e
        }
      }
    })
  })

addCommonOptions(deploy)