import { root, getAppName } from './root'
import { API } from './api'
import { getLocalRelease } from '../utils/local'
import { processResponse } from '../utils/cli'

import log from '../log'

import * as tar from 'tar-fs'
import * as glob from 'glob'
import { Readable } from 'stream';
import { createWriteStream, readFileSync } from 'fs';
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
          ...glob.sync('.fly/*/**.{js,json}')
        ].concat(...release.files.map((f) => glob.sync(f)))

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
              const hash = createHash("sha1")
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

        // packer.pause()

        // let chunks: Buffer[] = []

        // packer.on('data', (chunk) => {
        //   console.log("got chunk")
        //   if (chunk instanceof Buffer)
        //     return chunks.push(chunk)
        //   chunks.push(Buffer.from(chunk))
        // })

        // packer.on("end", () => {
        //   console.log("end")
        // })

        // packer.on("close", () => {
        //   console.log("close")
        // })

        // console.log("after ething")

        // log.debug("Packing files:", entries)

        // if (err)
        //   throw err
        // const res = await API.post(`/api/v1/apps/${appName}/releases`, {
        //   data: {
        //     attributes: {
        //       source: source,
        //       source_hash: hash,
        //       source_map: sourceMap,
        //       config: getLocalConfig(process.cwd(), "production").config || {}
        //     }
        //   }
        // }, {
        //     timeout: 60000
        //   })
        // processResponse(res, (res: any) => {
        //   console.log(`Deploying v${res.data.data.attributes.version} globally, should be updated in a few seconds.`)
        // })
      } catch (e) {
        if (e.response)
          console.log(e.response.data)
        else {
          throw e
        }
      }
    })
  })