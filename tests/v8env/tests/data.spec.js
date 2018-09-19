import { expect } from "chai"
import db, { Collection } from "@fly/data"

describe("@fly/data", () => {
  describe(".collection", () => {
    it("returns a Collection", () => {
      expect(db.collection("testing")).to.be.instanceOf(Collection)
    })
  })

  describe("Collection", () => {
    describe(".put", () => {
      it("upserts data", async () => {
        const coll = db.collection("testing")

        // insert initial object
        let ok = await coll.put("yo", { some: "json" })
        expect(ok).to.be.true

        // replace the object
        ok = await coll.put("yo", { some: "json2" })
        expect(ok).to.be.true

        // get the obj, to assert its value
        const res = await coll.get("yo")
        expect(res).to.deep.equal({ some: "json2" })
      })
      after(async () => {
        await db.dropCollection("testing")
      })
    })

    describe(".del", () => {
      it("delete data", async () => {
        const coll = db.collection("testing")
        const ok = await coll.put("yo", { some: "json" })
        expect(ok).to.be.true

        const okDel = await coll.del("yo")
        expect(okDel).to.equal(true)

        const res = await coll.get("yo")
        expect(res).to.equal(null)
      })
    })
  })

  describe(".getAll", () => {
    it("gets multiple results", async () => {
      const coll = db.collection("testing")
      const records = Array.from(Array(10).keys()).map(i => coll.put(`asdf${i}`, { some: `asdf-${i}` }))
      await Promise.all(records)

      const results = await coll.getAll("asdf")
      expect(results[0].some).to.eq("asdf-0")
      expect(results.length).to.eq(10)
    })
  })
})
