import { expect } from 'chai'
import balancer, { _internal, Backend } from "../src/balancer"

async function fakeFetch(req: RequestInfo, init?: RequestInit) {
  return new Response("hi")
}
async function fakeFetchError(req: RequestInfo, init?: RequestInit) {
  return new Response("nooooo", { status: 502 })
}

function healthy() {
  return <Backend>{
    proxy: fakeFetch.bind({}), // same function, different times
    requestCount: 0,
    responseTime: [30, 30, 30],
    lastError: 0,
    averageResponseTime: 30,
    errorCount: 0
  }
}
function unhealthy(score?: number) {
  const b = healthy()
  b.responseTime.push(500, 500, 500)
  b.averageResponseTime = score || 10000
  return b
}
describe("balancing", () => {
  describe("backend scoring", () => {
    it("should score backends correctly", () => {
      const backend = unhealthy()
      const score = _internal.score(backend)

      expect(score).to.eq(265)
    })
  })

  describe("backend selection", () => {
    it("should choose lower latency backends first", () => {
      const h = [healthy(), healthy()]
      const backends = [unhealthy(), unhealthy(), unhealthy()].concat(h)
      const [b1, b2] = _internal.chooseBackends(backends)

      expect(h.find((e) => e === b1)).to.eq(b1, "Backend 1 should be in selected")
      expect(h.find((e) => e === b2)).to.eq(b2, "Backend 2 should be in selected")
      expect(b1).to.not.eq(b2, "Backend 1 and Backend 2 should be different")
    })

    it("ignores backends that have been tried", () => {
      const h = [healthy(), healthy()]
      const backends = [unhealthy(), unhealthy(), unhealthy()].concat(h)
      const attempted = new Set<Backend>(h)

      const [b1, b2] = _internal.chooseBackends(backends, attempted)
      expect(h.find((e) => e === b1)).to.eq(undefined, "Backend 1 should not be in selected")
      expect(h.find((e) => e === b2)).to.eq(undefined, "Backend 2 should not be in selected")
      expect(b1).to.not.eq(b2, "Backend 1 and Backend 2 should be different")
    })
  })

  describe("backend stats", () => {
    it("should store last 10 response times", async () => {
      const req = new Request("http://localhost/hello/")
      const fn = balancer([fakeFetch])
      const backend = fn.backends[0]
      
      for (let i = 0; i < 20; i++) {
        let resp = await fn(req)
      }
      expect(backend.responseTime.length).to.eq(10)
    })

    it("should retry on failure", async () => {
      const fn = balancer([
        fakeFetchError.bind({}),
        fakeFetchError.bind({}),
        fakeFetch
      ])
      // raise health of the last backend so we try errors first
      fn.backends[2].averageResponseTime = 1000

      const resp = await fn("http://localhost/")
      const used = fn.backends.filter((b) => b.requestCount > 0)

      expect(resp.status).to.eq(200)
      expect(await resp.text()).to.eq("hi")
      expect(used.length).to.be.gte(2) // at least two backends hit
    })
  })
})