import * as path from "path"
import * as fs from "fs"
import * as tarStream from "tar-stream"
import * as zlib from "zlib"
import { createHash } from "crypto"

interface Tarball {
  path: string
  digest: string
  byteLength: number
}

export async function createReleaseTarball(
  outFile: string,
  manifest: Array<{ rootDir: string; files: string[] }>
): Promise<Tarball> {
  return new Promise((resolve, reject) => {
    const pack = tarStream.pack()

    for (const { rootDir, files } of manifest) {
      for (const file of files) {
        const stat = fs.statSync(file)
        if (!stat.isFile()) {
          continue
        }
        const name = path.relative(rootDir, file)
        pack.entry({ name }, fs.readFileSync(file))
      }
    }

    pack.finalize()
    const gzip = zlib.createGzip()
    const outStream = fs.createWriteStream(outFile)
    const bundleHash = createHash("sha1").setEncoding("hex")
    const gzStream = pack.pipe(gzip)
    gzStream.pipe(bundleHash)
    gzStream.pipe(outStream)

    gzStream.on("end", () => {
      bundleHash.end()
      outStream.end()

      resolve({
        path: outFile,
        digest: bundleHash.read().toString(),
        byteLength: outStream.bytesWritten
      })
    })
  })
}
