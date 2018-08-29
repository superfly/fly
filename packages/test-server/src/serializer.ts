import { Response } from "node-fetch"

export function test(value: any): boolean {
  return isResponse(value)
}

export function serialize(value: any, config: any, indentation: any, depth: any, refs: any, printer: any) {
  if (!isResponse(value)) {
    return printer(value, config, indentation, depth, refs)
  }
  const cleanResponse = snapshot(value)
  return printer(cleanResponse, config, indentation, depth, refs)
}

function isResponse(value: any): value is Response {
  return value && value instanceof Response
}

export async function snapshot(response: Response) {
  response = response.clone()
  const headers = response.headers.raw()

  for (const name in headers) {
    const values = headers[name]
    headers[name] = values.map(v => serializeHeader(name, v))
  }

  return {
    size: response.size,
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    type: response.type,
    url: response.url,
    headers: headers,
    timeout: response.timeout,
    body: await snapshotBody(response)
  }
}

function serializeHeader(name: string, value: string): string {
  console.log("serializeHeader", name, value)
  switch (name) {
    case "date":
      return "<date>"
    case "x-request-id":
      return "<request-id>"
  }
  return value
}

async function snapshotBody(response: Response) {
  const body = await response.text()

  const contentType = response.headers.get("Content-Type")
  switch (contentType) {
    case "application/json":
      return {
        contentType,
        data: JSON.parse(body)
      }
    default:
      return {
        contentType,
        data: body
      }
  }
}
