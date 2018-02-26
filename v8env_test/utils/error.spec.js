import { expect } from 'chai'
import { errorTransferInto } from '../../v8env/utils/error'

describe("error utils", () => {
  describe("errorTransferInto(err: Error)", () => {
    it("serializes an error to transfer", () => {
      expect(errorTransferInto(new TypeError("yo"))).to.include({
        __type: "error",
        message: "yo",
        name: "TypeError",
      })
    })
  })
})