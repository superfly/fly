import { expect } from 'chai'

describe("timers", () => {
  describe("setTimeout", () => {
    it("calls after the right amount of time", function (done) {
      const t = Date.now()
      setTimeout(function () {
        const dur = Date.now() - t
        try { expect(dur).to.be.within(99, 110) } catch (e) {
          done(e)
          return
        }
        done()
      }, 100)
    })
  })
})