import * as http from 'http'
import { Http2ServerRequest } from 'http2'
import log from '../log'

export function fullURL(proto: string, req: http.IncomingMessage | Http2ServerRequest): string {
  return `${proto}//${req.headers.host}${req.url}`
}

// Keep for a rainy day?
const specialHeadersMap: { [s: string]: string } = {
  "content-md5": "Content-MD5",
  "dnt": "DNT",
  "etag": "ETag",
  "last-event-id": "Last-Event-ID",
  "tcn": "TCN",
  "te": "TE",
  "www-authenticate": "WWW-Authenticate",
  "x-dnsprefetch-control": "X-DNSPrefetch-Control"
}