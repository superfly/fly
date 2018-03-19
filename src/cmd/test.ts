import * as fs from 'fs'
import * as path from 'path'
import * as winston from 'winston'

import glob = require('glob')
import { root } from './root'

import log from '../log'
import { Bridge } from '../bridge/bridge'

const scripts = [
  require.resolve("mocha/mocha"),
  require.resolve('../../v8env/testing/setup'),
].map((filename) => {
  return {
    filename: filename,
    code: fs.readFileSync(filename).toString()
  }
})

const runPath = require.resolve("../../v8env/testing/run")

interface TestArgs {
  paths?: string[]
}

root
  .subCommand<any, TestArgs>("test [paths...]")
  .description("Run unit tests, defaults to {test,spec}/**/*.{test,spec}.js")
  .action((opts, args, rest) => {
    const { ivm } = require('../')
    const { v8Env } = require('../v8env')
    const { FileAppStore } = require('../file_app_store')
    const { getWebpackConfig, buildAppWithConfig } = require('../utils/build')
    const { createContext } = require('../context')

    const cwd = process.cwd()

    let paths = args.paths && args.paths.length ?
      [].concat.apply([],
        args.paths.map((f) =>
          glob.sync(f).map((gf) =>
            path.resolve(cwd, gf)
          )
        )
      ) :
      glob.sync('./test/**/*.+(spec|test).js');

    if (paths.length === 0) {
      console.log("No test files found")
      return
    }

    let conf = getWebpackConfig(cwd)
    conf.entry = paths

    const appStore = new FileAppStore(cwd, { noWatch: true, noSource: true, env: "test" })

    buildAppWithConfig(conf, { watch: false }, async (err: Error, code: string, hash: string, sourceMap: string) => {
      if (err)
        throw err

      try {
        await v8Env.waitForReadiness()
        const iso = new ivm.Isolate({ snapshot: v8Env.snapshot })
        const ctx = await createContext(iso, new Bridge())

        await ctx.set('_log', new ivm.Reference(function (lvl: string, msg: string, ...args: any[]) {
          log.log(lvl, msg, ...args)
        }))

        const app = appStore.app

        ctx.meta.app = app

        ctx.logger.add(winston.transports.Console, {
          formatter: function (options: any) {
            return options.message
          }
        })

        await ctx.set('_mocha_done', new ivm.Reference(function (failures: number) {
          if (failures)
            return process.exit(1)
          process.exit()
        }))

        for (let script of scripts) {
          const compiled = await iso.compileScript(script.code, script)
          await compiled.run(ctx.ctx)
        }

        await ctx.set('app', app.forV8())

        const bundleName = `bundle-${hash}`
        const sourceFilename = `${bundleName}.js`
        const sourceMapFilename = `${bundleName}.map.json`
        const bundleScript = await iso.compileScript(code, { filename: sourceFilename })
        await bundleScript.run(ctx.ctx)

        const runScript = await iso.compileScript(fs.readFileSync(runPath).toString(), { filename: runPath })
        console.log("Running tests...")
        await runScript.run(ctx.ctx)
      } catch (err) {
        console.error(err.stack)
      }
    })
  })

