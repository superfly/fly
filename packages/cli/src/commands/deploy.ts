import { apiClient, processResponse } from "../api"
// import { getLocalRelease } from "@fly/core/lib/utils/local"
import log from "@fly/core/lib/log"
import * as tar from "tar-fs"
import * as glob from "glob"
import { createWriteStream, readFileSync, existsSync } from "fs"
import { createHash } from "crypto"
import * as pako from "pako"
import { AxiosResponse } from "axios"
import { resolve as pathResolve } from "path"
import { FlyCommand } from "../base-command"
import { getAppName, fullAppMatch } from "../util"
import * as sharedFlags from "../flags"
import { FileAppStore } from "@fly/core"
import { createReleaseTarball } from "@fly/build"
import * as path from "path"
import * as fs from "fs"

export default class Deploy extends FlyCommand {
  static description = "Deploy your local Fly app"

  static args = [{ name: "path", description: "path to app", default: process.cwd() }]

  public static flags = {
    env: sharedFlags.env({ default: "production" }),
    app: sharedFlags.app()
  }

  async run() {
    const { args, flags } = this.parse(Deploy)
    const API = apiClient(this)
    const env = flags.env!
    const cwd = args.path || process.cwd()
    const appName = getAppName({ ...flags, cwd })

    this.log("Deploying", appName, `(env: ${env})`)

    const appStore = new FileAppStore({ path: cwd, env, build: false })
    await appStore.build()

    const outFile = path.resolve(cwd, ".fly/release.tar.gz")
    const tarball = await createReleaseTarball(outFile, appStore.manifest())

    const gz = fs.createReadStream(tarball.path)

    const res = await API.post(`/api/v1/apps/${appName}/releases`, gz, {
      params: {
        sha1: tarball.digest,
        env
      },
      headers: {
        "Content-Type": "application/x-tar",
        "Content-Length": tarball.byteLength,
        "Content-Encoding": "gzip"
      },
      maxContentLength: 100 * 1024 * 1024,
      timeout: 120 * 1000
    })

    processResponse(this, res, () => {
      this.log(`Deploying v${res.data.data.attributes.version} globally @ https://${appName}.edgeapp.net`)
      this.log(`App should be updated in a few seconds.`)
    })
  }
}

// import { apiClient, processResponse } from "../api"
// import log from "@fly/core/lib/log"
// import * as tar from "tar-fs"
// import * as glob from "glob"
// import { createWriteStream, readFileSync, existsSync } from "fs"
// import { createHash } from "crypto"
// import * as pako from "pako"
// import { AxiosResponse } from "axios"
// import { resolve as pathResolve } from "path"
// import { FlyCommand } from "../base-command"
// import { getAppName, fullAppMatch } from "../util"
// import * as sharedFlags from "../flags"
// import { FileAppStore } from "@fly/core"

// export default class Deploy extends FlyCommand {
//   static description = "Deploy your local Fly app"

//   static args = [{ name: "path", description: "path to app", default: process.cwd() }]

//   public static flags = {
//     env: sharedFlags.env({ default: "production" }),
//     app: sharedFlags.app()
//   }

//   async run() {
//     const { args, flags } = this.parse(Deploy)
//     const API = apiClient(this)
//     const env = flags.env!
//     const cwd = args.path || process.cwd()
//     const appName = getAppName({ ...flags, cwd })

//     this.log("Deploying", appName, `(env: ${env})`)

//     const appStore = new FileAppStore({ path: cwd, build: true, env })
//     const release = appStore.release

//     try {
//       // look for generated config
//       const configPath = existsSync(pathResolve(".fly", ".fly.yml")) ? ".fly/.fly.yml" : ".fly.yml"

//       const entries = [
//         configPath,
//         ...glob.sync(".fly/*/**.{js,json}", {
//           // processed .fly.yml
//           cwd
//         }),
//         ...release.files
//       ].filter(f => existsSync(pathResolve(cwd, f)))

//       const res = await new Promise<AxiosResponse<any>>((resolve, reject) => {
//         tar
//           .pack(cwd, {
//             entries,
//             map: header => {
//               if (header.name === ".fly/.fly.yml") {
//                 // use generated .fly.yml as config (for globbing)
//                 header.name = ".fly.yml"
//               }
//               return header
//             },
//             dereference: true,
//             finish() {
//               log.debug("Finished packing.")
//               const buf = readFileSync(pathResolve(cwd, ".fly/bundle.tar"))
//               console.log(`Bundle size: ${buf.byteLength / (1024 * 1024)}MB`)
//               const gz = pako.gzip(buf)
//               console.log(`Bundle compressed size: ${gz.byteLength / (1024 * 1024)}MB`)
//               const bundleHash = createHash("sha1") // we need to verify the upload is :+1:
//               bundleHash.update(buf)

//               API.post(`/api/v1/apps/${appName}/releases`, gz, {
//                 params: {
//                   sha1: bundleHash.digest("hex"),
//                   env
//                 },
//                 headers: {
//                   "Content-Type": "application/x-tar",
//                   "Content-Length": gz.byteLength,
//                   "Content-Encoding": "gzip"
//                 },
//                 maxContentLength: 100 * 1024 * 1024,
//                 timeout: 120 * 1000
//               })
//                 .then(resolve)
//                 .catch(reject)
//             }
//           })
//           .pipe(createWriteStream(pathResolve(cwd, ".fly/bundle.tar")))
//       })

//       processResponse(this, res, () => {
//         this.log(`Deploying v${res.data.data.attributes.version} globally @ https://${appName}.edgeapp.net`)
//         this.log(`App should be updated in a few seconds.`)
//       })
//     } catch (err) {
//       return this.error(err, { exit: 1 })
//     }
//   }
// }
