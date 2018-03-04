import './helper'
import { createContext, ivm, v8Env } from "../src";
import { parseConfig } from '../src/config';
import { expect } from 'chai'

describe('Context', () => {
  describe('no leaks!', () => {
    before(async function () {
      await v8Env.waitForReadiness()
      this.iso = new ivm.Isolate({ memoryLimit: 128, snapshot: v8Env.snapshot })
      this.ctx = await createDefaultContext(this.iso)
    })
    after(async function () {
      await this.ctx.release()
      this.iso.dispose()
    })

    it('releases all references and external copies', async function () {
      const initCount = this.ctx.releasables.length
      this.ctx.addReleasable(new ivm.Reference("hola"))
      expect(this.ctx.releasables).to.have.lengthOf(initCount + 1)
      await this.ctx.finalize()
      expect(this.ctx.releasables).to.be.empty
    })

    it('does not leak (in a major way) when creating contexts profusely', async function () {
      this.timeout(10000)
      const initHeap = this.iso.getHeapStatisticsSync().used_heap_size
      for (let i = 0; i < 200; i++) {
        let ctx = await createDefaultContext(this.iso)
        await ctx.finalize()
        await ctx.release()
      }
      expect(this.iso.getHeapStatisticsSync().used_heap_size).to.be.within(
        initHeap - (1024 * 1024),
        initHeap + (15 * 1024 * 1024) // GC is not perfect.
      )
    })
  })
})

async function createDefaultContext(iso: ivm.Isolate) {
  return createContext(parseConfig(process.cwd()), iso)
}