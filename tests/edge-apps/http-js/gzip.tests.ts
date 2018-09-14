import * as path from "path"
import * as zlib from "zlib"

setupApps({
  "edge.test": path.resolve(__dirname, "proxy.js"),
  "origin.test": path.resolve(__dirname, "gzip.js")
})

async function inflateBody(response: Response): Promise<string> {
  const buffer = await response.arrayBuffer()
  return zlib.gunzipSync(new DataView(buffer)).toString()
}

describe.each(["edge.test", "origin.test"])("gzip to %s", (host) => {
  const contentTypes = ["text/plain", "application/json", "application/javascript", "application/x-javascript"]
  for (const contentType of contentTypes) {
    describe(`with ${contentType} Content-Type`, () => {
      test('return gzip if accepted', async () => {
        const response = await fetch(`http://${host}/${contentType}`, { headers: { "accept-encoding": 'gzip,deflate' } })
        expect(response.status).toEqual(200)
        expect(response.headers.get("content-type")).toEqual(contentType)
        expect(response.headers.get("content-encoding")).toEqual("gzip")
        expect(await inflateBody(response)).toEqual(contentType)
      })

      test('return original if not accepted', async () => {
        const response = await fetch(`http://${host}/${contentType}`, { headers: { "accept-Encoding": "identity" } })
        expect(response.status).toEqual(200)
        expect(response.headers.get("content-type")).toEqual(contentType)
        expect(response.headers.get("content-encoding")).not.toEqual("gzip")
        expect(await response.text()).toEqual(contentType)
      })

      test('do not recompress', async () => {
        const response = await fetch(`http://${host}/${contentType}?gz`, { headers: { "accept-Encoding": "gzip,deflate" } })
        expect(response.status).toEqual(200)
        expect(response.headers.get("content-type")).toEqual(contentType)
        expect(response.headers.get("content-encoding")).toEqual("gzip")
        expect(await response.text()).toEqual(contentType)
      })
    })
  }

  describe(`with binary Content-Type`, () => {
    test('do not compress image/*', async () => {
      const response = await fetch(`http://${host}/image/jpeg`, { headers: { "accept-Encoding": "gzip,deflate" } })
      expect(response.status).toEqual(200)
      expect(response.headers.get("content-type")).toEqual("image/jpeg")
      expect(response.headers.get("content-encoding")).toBeNull()
      expect(await response.text()).toEqual("image/jpeg")
    })
  })
})
