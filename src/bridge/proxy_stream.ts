import { registerBridge } from './'
import { ivm } from "../";
import { Bridge } from './bridge';
import { Runtime } from '../runtime';
import { streamManager } from '../stream_manager';

registerBridge("streamSubscribe", function (rt: Runtime, bridge: Bridge, id: string, cb: ivm.Reference<Function>) {
  streamManager.subscribe(rt, id, cb)
})

registerBridge("streamRead", function (rt: Runtime, bridge: Bridge, id: string, cb: ivm.Reference<Function>) {
  streamManager.read(rt, id, cb)
})