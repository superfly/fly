import log from '../log'

import { ivm, App } from '..';

import { registerBridge } from '.';
import { Context } from '../context';
import { Bridge } from './bridge';

import { SourceMapConsumer, MappedPosition, Position } from 'source-map'
import { readFileSync } from 'fs';

const v8EnvSourceMapConsumer = new SourceMapConsumer(require("../../dist/v8env.map.json"))

const smConsumers: { [source: string]: SourceMapConsumer } = {}

registerBridge("SourceMapConsumer.originalPositionFor", function (ctx: Context, bridge: Bridge, source: string, position: Position): Promise<ivm.Copy<MappedPosition>> {
  let mp: MappedPosition;
  if (source === "dist/v8env.js") {
    mp = v8EnvSourceMapConsumer.originalPositionFor(position)
  } else {
    const app = <App>ctx.meta.app
    if (app.sourceMap) {
      const sourceKey = `${app.name}:${app.version}:${source}`
      try {
        const sm = smConsumers[sourceKey] || (smConsumers[sourceKey] = new SourceMapConsumer(JSON.parse(app.sourceMap)))
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