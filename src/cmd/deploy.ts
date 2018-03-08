import { root, getAppName } from './root'
import { API } from './api'
import { getLocalRelease } from '../utils/local'
import { processResponse } from '../utils/cli'

import log from '../log'

import * as tar from 'tar-fs'
import * as glob from 'glob'
import { Readable } from 'stream';
import { createWriteStream, readFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';

import * as pako from 'pako'

export interface DeployOptions { }
export interface DeployArgs { }

root
  .subCommand<DeployOptions, DeployArgs>("deploy")
  .description("Deploy your local Fly app.")
  .action((opts, args, rest) => {
    const { buildApp } = require('../utils/build')
    const appName = getAppName("production")
    console.log("Deploying", appName)
    const cwd = process.cwd()

    const release = getLocalRelease(cwd, "production", { noWatch: true })

    buildApp(cwd, { watch: false, uglify: true }, async (err: Error, source: string, hash: string, sourceMap: string) => {
      try {
        const entries = [
          '.fly.yml',
          ...glob.sync('.fly/*/**.{js,json}'),
          ...release.files
        ].filter((f) => existsSync(f))

        const res = await new Promise((resolve, reject) => {
          const packer: Readable = tar.pack('.', {
            entries: entries,
            dereference: true,
            finish: function () {
              log.debug("Finished packing.")
              const buf = readFileSync(".fly/bundle.tar")
              console.log(`Bundle size: ${buf.byteLength / (1024 * 1024)}MB`)
              const gz = pako.gzip(buf)
              console.log(`Bundle compressed size: ${gz.byteLength / (1024 * 1024)}MB`)
              const hash = createHash("sha1") // we need to verify the upload is :+1:
              hash.update(buf)

              const res = API.post(`/api/v1/apps/${appName}/releases`, gz, {
                params: {
                  sha1: hash.digest('hex')
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
          }).pipe(createWriteStream(".fly/bundle.tar"))
        })

        processResponse(res, (res: any) => {
          console.log(`Deploying v${res.data.data.attributes.version} globally, should be updated in a few seconds.`)
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