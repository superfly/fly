import * as fs from "fs"
import * as path from "path"
import glob = require("glob")
import { Bridge } from "./bridge/bridge"
import { LocalRuntime } from "./local_runtime"
import { App } from "./app"
import { SQLiteDataStore } from "./sqlite_data_store"
import { v8envModulePath } from "./v8env"
import { FileAppStore } from "./file_app_store"

interface TestRunnerOptions {
  cwd?: string
  paths?: string[]
}

export class TestRunner {
  public static defaultPattern = "{test,spec,tests,specs}/**/*.{test,spec}.{js,ts}"

  cwd: string
  testFiles: string[] = []

  public constructor(options: TestRunnerOptions) {
    console.log({ options })
    this.cwd = options.cwd || process.cwd()
    if (options.paths) {
      this.addTestFiles(options.paths)
    }
  }

  public addTestFiles(pathPatterns: string | string[]) {
    for (let pathPattern of Array.from(pathPatterns)) {
      pathPattern = path.resolve(this.cwd, pathPattern)
      console.log("scanning", { pathPattern })
      const paths = glob.sync(pathPattern).map(matchPath => path.resolve(this.cwd, matchPath))
      console.log("paths", { paths })
      if (paths) {
        this.testFiles.push(...paths)
      }
    }
  }

  public async run() {
    if (this.testFiles.length === 0) {
      throw new Error("no test files found")
    }

    const { ivm } = require("./ivm")
    const { getWebpackConfig, buildAppWithConfig } = require("./utils/build")

    const conf = getWebpackConfig(this.cwd)
    conf.entry = this.testFiles

    const appStore = new FileAppStore(this.cwd, { noWatch: true, noSource: true, env: "test" })

    return new Promise<boolean>((resolve, reject) => {
      buildAppWithConfig(
        this.cwd,
        conf,
        { watch: false },
        async (err: Error, code: string, hash: string, sourceMap: string) => {
          if (err) {
            throw err
          }

          try {
            const app = appStore.app
            const rt = new LocalRuntime(
              new App({
                app: app.name,
                version: app.version,
                source: "",
                sourceHash: "",
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
              new ivm.Reference((failures: number) => {
                resolve(failures === 0)
              })
            )

            for (const script of testScripts()) {
              const compiled = await rt.isolate.compileScript(script.code, script)
              await compiled.run(rt.context)
            }

            await rt.setApp(app)

            const bundleName = `bundle-${hash}`
            const sourceFilename = `${bundleName}.js`
            const sourceMapFilename = `${bundleName}.map.json`
            const bundleScript = await rt.isolate.compileScript(code, { filename: sourceFilename })
            await bundleScript.run(rt.context)

            const runPath = runScriptPath()

            const runScript = await rt.isolate.compileScript(fs.readFileSync(runPath).toString(), {
              filename: runPath
            })
            console.log("Running tests...")
            await runScript.run(rt.context)
          } catch (err) {
            reject(err)
          }
        }
      )
    })
  }
}

function testScripts() {
  return [require.resolve("mocha/mocha"), require.resolve(path.join(v8envModulePath, "testing", "setup"))].map(
    filename => {
      return {
        filename,
        code: fs.readFileSync(filename).toString()
      }
    }
  )
}

function runScriptPath() {
  return require.resolve(path.join(v8envModulePath, "testing", "run"))
}

// interface TestArgs {
//   paths?: string[]
// }

// root
//   .subCommand<any, TestArgs>("test [paths...]")
//   .description("Run unit tests, defaults to {test,spec}/**/*.{test,spec}.{js,ts}")
//   .action((opts, args, rest) => {
//     const { ivm } = require("../")
//     const { getWebpackConfig, buildAppWithConfig } = require("../utils/build")

//     // const cwd = process.cwd()

//     const paths =
//       args.paths && args.paths.length
//         ? [].concat.apply([], args.paths.map(f => glob.sync(f).map(gf => path.resolve(cwd, gf))) as any)
//         : glob.sync("./test/**/*.+(spec|test).[jt]s")

//     )
//   })
