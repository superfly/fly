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
    this.cwd = options.cwd || process.cwd()

    console.log("TestRunner", { cwd: this.cwd })
    if (options.paths) {
      this.addTestFiles(options.paths)
    }
  }

  public addTestFiles(pathPatterns: string | string[]) {
    for (let pathPattern of Array.from(pathPatterns)) {
      pathPattern = path.resolve(this.cwd, pathPattern)
      const paths = glob.sync(pathPattern).map(matchPath => path.resolve(this.cwd, matchPath))
      if (paths) {
        this.testFiles.push(...paths)
      }
    }
  }

  public async run(): Promise<boolean> {
    if (this.testFiles.length === 0) {
      throw new Error("no test files found")
    }

    const { ivm } = require("./ivm")

    return new Promise<boolean>(async (resolve, reject) => {
      const appStore = new FileAppStore({
        path: this.cwd,
        env: "test",
        buildOptions: {
          entry: this.testFiles
        }
      })

      const buildInfo = await appStore.build()

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
          new Bridge({ dataStore: new SQLiteDataStore(app.name, "test") })
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

        const bundleName = `bundle-${app.hash}`
        const sourceFilename = `${bundleName}.js`
        const sourceMapFilename = `${bundleName}.map.json`
        await rt.isolate.compileScript(buildInfo.source.text, { filename: sourceFilename })

        const runPath = runScriptPath()

        const runScript = await rt.isolate.compileScript(fs.readFileSync(runPath).toString(), {
          filename: runPath
        })

        await runScript.run(rt.context)
      } catch (err) {
        reject(err)
      }
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
