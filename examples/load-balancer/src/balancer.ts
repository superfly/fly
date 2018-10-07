/**
 * A fetch function load balancer. Distributes requests to a set of backends; attempts to 
 * send requests to lowest latency backends using a 2 random (pick two fastest, 
 * randomize which gets requests).
 * 
 * If all backends are healthy, tries to evenly distribute requests as much as possible.
 * 
 * When backends return server errors (500-599) it retries idempotent requests
 *  until it gets a good response, or all backends have been tried.
 * 
 * @param backends fetch functions for each backend to balance accross
 * @returns a function that behaves just like fetch, with a `.backends` property for 
 * retrieving backend stats.
 */
export default function balancer(backends: FetchFn[]) {
  const tracked = backends.map((h) => {
    if (typeof h !== "function") {
      throw Error("Backend must be a fetch like function")
    }
    return <Backend>{
      proxy: h,
      requestCount: 0,
      scoredRequestCount: 0,
      responseTime: Array<number>(10),
      lastError: 0,
      averageResponseTime: 0,
      errorCount: 0
    }
  })

  const fn = async function fetchBalancer(req: RequestInfo, init?: RequestInit | undefined): Promise<Response> {
    if (typeof req === "string") {
      req = new Request(req)
    }
    const attempted = new Set<Backend>()
    while (attempted.size < tracked.length) {
      let backend: Backend | null = null
      const [backendA, backendB] = chooseBackends(tracked, attempted)

      if (!backendA) {
        return new Response("No backend available", { status: 502 })
      }
      if (!backendB) {
        backend = backendA
      } else {
        // randomize between 2 good candidates
        backend = (Math.floor(Math.random() * 2) == 0) ? backendA : backendB
      }

      const promise = backend.proxy(req, init)
      if (backend.scoredRequestCount != backend.requestCount) {
        // fixup score
        // this should be relatively concurrent with the fetch promise
        score(backend)
      }
      backend.requestCount += 1
      attempted.add(backend)

      let resp: Response
      let beginTime = new Date();
      let endTime;

      try {
        resp = await promise
      } catch (e) {
        resp = proxyError
      } finally {
        endTime = new Date();
      }

      //calculate the response time and save to backend
      let responseTime = endTime.getMilliseconds() - beginTime.getMilliseconds();
      if (backend.responseTime.length < 10) {
        backend.responseTime.push(responseTime);
      } else {
        backend.responseTime[(backend.requestCount - 1) % backend.responseTime.length] = responseTime
      }

      if (resp.status >= 500 && resp.status < 600) {
        // clear out response to trigger retry
        if (canRetry(req, resp)) {
          continue
        }
      }

      return resp
    }

    return proxyError
  }

  return Object.assign(fn, { backends: tracked })
}
const proxyError = new Response("couldn't connect to origin", { status: 502 })
export interface FetchFn {
  (req: RequestInfo, init?: RequestInit | undefined): Promise<Response>
}

/**
 * Represents a backend with health and statistics.
 */
export interface Backend {
  proxy: (req: RequestInfo, init?: RequestInit | undefined) => Promise<Response>,
  requestCount: 0,
  scoredRequestCount: 0,
  responseTime: number[],
  lastError: number,
  averageResponseTime: number,
  errorCount: 0
}
// calculate a health score based on the average responseTime
function score(backend: Backend) {
  const responseTimes = backend.responseTime;
  const score = responseTimes.reduce(function (a, b) { return a + b; }) / responseTimes.length;
  backend.averageResponseTime = score;
  backend.scoredRequestCount = backend.requestCount
  return score
}

function canRetry(req: Request, resp: Response) {
  if (resp && resp.status < 500) return false // don't retry normal boring errors or success
  if (req.method == "GET" || req.method == "HEAD") return true
  return false
}

function chooseBackends(backends: Backend[], attempted?: Set<Backend>) {
  let b1: Backend | undefined
  let b2: Backend | undefined
  for (let i = 0; i < backends.length; i++) {
    const b = backends[i]
    if (attempted && attempted.has(b)) continue;

    if (!b1) {
      b1 = b
      continue
    }
    if (!b2) {
      b2 = b
      continue
    }

    const old1 = b1
    b1 = bestBackend(b, b1)

    if (old1 != b1) {
      // b1 got replaced, make sure it's not better
      b2 = bestBackend(old1, b2)
    } else {
      b2 = bestBackend(b, b2)
    }
  }

  return [b1, b2]
}

function bestBackend(b1: Backend, b2: Backend) {
  if (
    b1.averageResponseTime < b2.averageResponseTime ||
    (b1.averageResponseTime == b2.averageResponseTime && b1.requestCount < b2.requestCount)
  ) {
    return b1
  }
  return b2
}

export const _internal = {
  chooseBackends,
  score
}