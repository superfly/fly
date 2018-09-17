import * as fs from "fs"
import * as path from "path"

import glob = require("glob")
import { root } from "./root"

import { Bridge } from "../bridge/bridge"
import { LocalRuntime } from "../local_runtime"
import { App } from "../app"
import { SQLiteDataStore } from "../sqlite_data_store"
import { v8envModulePath } from "../v8env"

const scripts = [
  require.resolve("mocha/mocha"),
  require.resolve(path.join(v8envModulePath, "testing", "setup"))
].map(filename => {
  return {
    filename,
    code: fs.readFileSync(filename).toString()
  }
})

const runPath = require.resolve(path.join(v8envModulePath, "testing", "run"))

interface TestArgs {
  paths?: string[]
}

import { FileAppStore } from "../file_app_store"

root
  .subCommand<any, TestArgs>("test [paths...]")
  .description("Run unit tests, defaults to {test,spec}/**/*.{test,spec}.{js,ts}")
  .action((opts, args, rest) => {
    const { ivm } = require("../")
    const { getWebpackConfig, buildAppWithConfig } = require("../utils/build")

    const cwd = process.cwd()

    const paths =
      args.paths && args.paths.length
        ? [].concat.apply([], args.paths.map(f => glob.sync(f).map(gf => path.resolve(cwd, gf))))
        : glob.sync("./test/**/*.+(spec|test).[jt]s")

    if (paths.length === 0) {
      console.log("No test files found")
      return
    }

    const conf = getWebpackConfig(cwd)
    conf.entry = paths

    const appStore = new FileAppStore(cwd, { noWatch: true, noSource: true, env: "test" })

    buildAppWithConfig(
      cwd,
      conf,
      { watch: false },
      async (err: Error, code: string, hash: string, sourceMap: string) => {
        if (err) {
          throw err
        }

        const app = appStore.app

        try {
          const app = appStore.app
          const rt = new LocalRuntime(
            new App({
              app: app.name,
              version: app.version,
              source: "",
              source_hash: "",
              config: {},
              secrets: {},
              env: "test"
            }),
            new Bridge({
              dataStore: new SQLiteDataStore(app.name, "test")
            })
          )

          await rt.set(
            "_mocha_done",
            new ivm.Reference(function(failures: number) {
              if (failures) {
                return process.exit(1)
              }
              process.exit()
            })
          )

          for (const script of scripts) {
            const compiled = await rt.isolate.compileScript(script.code, script)
            await compiled.run(rt.context)
          }

          await rt.setApp(app)

          const bundleName = `bundle-${hash}`
          const sourceFilename = `${bundleName}.js`
          const sourceMapFilename = `${bundleName}.map.json`
          const bundleScript = await rt.isolate.compileScript(code, { filename: sourceFilename })
          await bundleScript.run(rt.context)

          const runScript = await rt.isolate.compileScript(fs.readFileSync(runPath).toString(), {
            filename: runPath
          })
          console.log("Running tests...")
          await runScript.run(rt.context)
        } catch (err) {
          console.error(err.stack)
        }
      }
    )
  })
