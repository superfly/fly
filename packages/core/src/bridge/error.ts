import { ivm } from '..';

import { registerBridge } from '.';
import { Bridge } from './bridge';

import { SourceMapConsumer, MappedPosition, Position } from 'source-map'
import { Runtime } from '../runtime';
import { v8DistroMapPath } from "../v8env"

const v8EnvSourceMapConsumer = new SourceMapConsumer(require(v8DistroMapPath)) // new SourceMapConsumer(require("../../dist/v8env.map.json"))

const smConsumers: { [source: string]: SourceMapConsumer } = {}

registerBridge("SourceMapConsumer.originalPositionFor", function (rt: Runtime, bridge: Bridge, source: string, position: Position): Promise<ivm.Copy<MappedPosition>> {
  let mp: MappedPosition;
  if (source === "dist/v8env.js") {
    mp = v8EnvSourceMapConsumer.originalPositionFor(position)
  } else {
    if (rt.app.sourceMap) {
      const sourceKey = `${rt.app.name}:${rt.app.version}:${source}`
      try {
        const sm = smConsumers[sourceKey] || (smConsumers[sourceKey] = new SourceMapConsumer(JSON.parse(rt.app.sourceMap)))
        mp = sm.originalPositionFor(position)
      } catch (e) {
        mp = Object.assign({}, position, { source: source })
      }
    } else {
      mp = Object.assign({}, position, { source: source })
    }
  }
  return Promise.resolve(new ivm.ExternalCopy(mp).copyInto({ release: true }))
})