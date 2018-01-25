import * as fs from 'fs'
import * as path from 'path'
import { ivm } from '../'
import { getWebpackConfig, buildAppWithConfig } from '../utils/build'
import { createContext } from '../context'
import { v8Env } from '../v8env'
import log from '../log'

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

export async function runTests(cwd: string, paths: string[]) {
  if (paths.length === 0) {
    console.log("No test files found.")
    process.exit(1)
  }

  let conf = getWebpackConfig(cwd)
  conf.entry = paths

  buildAppWithConfig(conf, { watch: false }, async (err: Error, code: string) => {
    if (err)
      throw err

    try {
      await v8Env.waitForReadiness()
      const iso = new ivm.Isolate({ snapshot: v8Env.snapshot })
      const ctx = await createContext(iso)

      await ctx.set('_mocha_done', new ivm.Reference(function (failures: number) {
        if (failures)
          return process.exit(1)
        process.exit()
      }))

      for (let script of scripts) {
        const compiled = await iso.compileScript(script.code, script)
        await compiled.run(ctx.ctx)
      }

      const bundleScript = await iso.compileScript(code, { filename: 'bundle.js' })
      await bundleScript.run(ctx.ctx)
      const runScript = await iso.compileScript(fs.readFileSync(runPath).toString(), { filename: runPath })
      await runScript.run(ctx.ctx)
    } catch (err) {
      console.error(err)
    }
  })
}