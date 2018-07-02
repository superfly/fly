import { expect } from 'chai'

describe("timers", () => {
  describe("setTimeout", () => {
    it("calls after the right amount of time", function (done) {
      const t = Date.now()
      setTimeout(function () {
        const dur = Date.now() - t
        try { expect(dur).to.be.within(19, 100) } catch (e) {
          done(e)
          return
        }
        done()
      }, 20)
    })
    it("is cleared", function (done) {
      const t = setTimeout(function () {
        done(new Error("should not be called"))
      }, 30)
      setTimeout(function () {
        clearTimeout(t)
      }, 10)
      setTimeout(function () {
        done()
      }, 50)
    })
    it("is cleared", function (done) {
      const t = setTimeout(function () {
        done(new Error("should not be called"))
      }, 30)
      setTimeout(function () {
        clearTimeout(t)
      }, 10)
      setTimeout(function () {
        done()
      }, 50)
    })
  })
})