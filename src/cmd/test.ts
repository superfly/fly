import * as fs from 'fs'
import * as path from 'path'

import glob = require('glob')
import { root } from './root'

import log from '../log'
import { Bridge } from '../bridge/bridge'
import { LocalRuntime } from '../local_runtime';
import { App } from '../app';

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

import { FileAppStore } from '../file_app_store';

root
  .subCommand<any, TestArgs>("test [paths...]")
  .description("Run unit tests, defaults to {test,spec}/**/*.{test,spec}.js")
  .action((opts, args, rest) => {
    const { ivm } = require('../')
    const { v8Env } = require('../v8env')
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

    buildAppWithConfig(cwd, conf, { watch: false }, async (err: Error, code: string, hash: string, sourceMap: string) => {
      if (err)
        throw err

      try {
        const app = appStore.app
        const rt = new LocalRuntime(new App({ app: app.name, version: app.version, source: "", source_hash: "", config: {}, secrets: {}, env: "test" }), new Bridge)

        await rt.set('_mocha_done', new ivm.Reference(function (failures: number) {
          if (failures)
            return process.exit(1)
          process.exit()
        }))

        for (let script of scripts) {
          const compiled = await rt.isolate.compileScript(script.code, script)
          await compiled.run(rt.context)
        }

        await rt.setApp(app)

        const bundleName = `bundle-${hash}`
        const sourceFilename = `${bundleName}.js`
        const sourceMapFilename = `${bundleName}.map.json`
        const bundleScript = await rt.isolate.compileScript(code, { filename: sourceFilename })
        await bundleScript.run(rt.context)

        const runScript = await rt.isolate.compileScript(fs.readFileSync(runPath).toString(), { filename: runPath })
        console.log("Running tests...")
        await runScript.run(rt.context)
      } catch (err) {
        console.error(err.stack)
      }
    })
  })

