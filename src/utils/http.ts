import * as http from 'http'
import log from '../log'

export function headersForWeb(headers: any[]): string[][] {
  let webHeaders: string[][] = []
  let lastKey
  for (const [n, k] of Object.entries(headers)) {
    if (parseInt(n, 10) % 2) { // odd
      webHeaders.push([lastKey, k])
      continue
    }
    lastKey = k
  }
  return webHeaders
}

export function fullURL(proto: string, req: http.IncomingMessage): string {
  return `${proto}//${req.headers.host}${req.url}`
}

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

export function normalizeHeader(header: string): string {
  const result: string | undefined = specialHeadersMap[header.toLowerCase()];
  if (result)
    return result

  //the default
  return header
    .split("-")
    .map(function (text) {
      return text.charAt(0).toUpperCase() + text.substr(1).toLowerCase();
    })
    .join("-");
}