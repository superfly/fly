/**
 * Utilities and types for working with `fetch` functions.
 * 
 * @preferred
 * @module fly/fetch
 */

/**
 * Fly augmented Request, adds extra relevant fields for proxy level 
 * Requests.
 */
export interface FlyRequest extends Request {
  remoteAddr?: string
}
/**
 * A fetch-like function.
 */
export interface FetchFunction {
  (req: RequestInfo, init?: RequestInit): Promise<Response>
}

/**
 * A function that generates a fetch-like function with additional logic
 */
export interface FetchGenerator {
  (...any: any[]): FetchFunction
}

/**
 * Converts RequestInfo into a Request object.
 * @param req raw request
 */
export function normalizeRequest(req: RequestInfo) {
  if (typeof req === "string") {
    req = new Request(req)
  }
  if (!(req instanceof Request)) {
    throw new Error("req must be either a string or a Request object")
  }
  return <FlyRequest>req
}