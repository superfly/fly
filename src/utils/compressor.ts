import * as http from 'http'
import * as zlib from 'zlib'
import * as brotli from 'iltorb'

import { Writable } from 'stream';

export function compressResponse(req: http.IncomingMessage, res: http.OutgoingMessage): Writable {
  let contentEncoding = res.getHeader("content-encoding")
  let contentType = res.getHeader("content-type")
  let acceptEncoding = req.headers['accept-encoding']
  if (acceptEncoding && acceptEncoding instanceof Array) {
    acceptEncoding = acceptEncoding.join(", ")
  }
  if (contentType && contentType instanceof Array) {
    contentType = contentType.join(", ")
  } else if (contentType) {
    contentType = contentType.toString()
  }

  if (!acceptEncoding || typeof contentType !== "string") return res

  const compressable = contentType.includes("text/") ||
    contentType.includes("application/javascript") ||
    contentType.includes("application/json")

  if (!compressable) return res

  let canBrotli = false
  let canGzip = false

  if (acceptEncoding.match(/[^a-z0-9]?br[^a-z0-9]?/i)) {
    canBrotli = true
  }
  else if (acceptEncoding.includes("gzip")) {
    canGzip = true
  }

  let dst: Writable | undefined
  if (canBrotli) {
    dst = brotli.compressStream()
    res.setHeader("content-encoding", "br")
  }
  if (canGzip) {
    dst = zlib.createGzip({ level: 2 })
    res.setHeader("content-encoding", "gzip")
  }
  console.log("can compress?:", canBrotli, canGzip, acceptEncoding, contentType)
  if (dst) {
    res.removeHeader("Content-Length")
    dst.pipe(res)
    return dst
  }
  return res
}