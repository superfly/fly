import { ivm } from ".."

import { registerBridge } from "."
import { Bridge } from "./bridge"

import { SourceMapConsumer, MappedPosition, Position, NullableMappedPosition } from "source-map"
import { Runtime } from "../runtime"
import { v8DistroMapPath } from "../v8env"

const v8EnvSourceMapConsumer = new SourceMapConsumer(require(v8DistroMapPath)) // new SourceMapConsumer(require("../../dist/v8env.map.json"))

const smConsumers: { [source: string]: SourceMapConsumer } = {}

registerBridge(
  "SourceMapConsumer.originalPositionFor",
  async (rt: Runtime, bridge: Bridge, source: string, position: Position) => {
    let mp: NullableMappedPosition
    if (source === "dist/v8env.js") {
      mp = (await v8EnvSourceMapConsumer).originalPositionFor(position)
    } else {
      if (rt.app.sourceMap) {
        const sourceKey = `${rt.app.name}:${rt.app.version}:${source}`
        try {
          const sm =
            smConsumers[sourceKey] ||
            (smConsumers[sourceKey] = await new SourceMapConsumer(JSON.parse(rt.app.sourceMap)))
          mp = sm.originalPositionFor(position)
        } catch (e) {
          mp = Object.assign({}, position, { source, name: null })
        }
      } else {
        mp = Object.assign({}, position, { source, name: null })
      }
    }
    return new ivm.ExternalCopy(mp).copyInto({ release: true })
  }
)
