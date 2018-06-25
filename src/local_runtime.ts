import { Runtime } from "./runtime";
import { App } from "./app";
import { Bridge } from "./bridge/bridge";
import { ivm } from ".";
import { v8Env } from "./v8env";
import log from "./log";

import * as WebSocket from 'ws';
import { inspect } from "util";

export interface LocalRuntimeOptions {
  inspect?: boolean
  monitorFrequency?: number
}

const LOCAL_RUNTIME_DEFAULTS: LocalRuntimeOptions = { monitorFrequency: 5000, inspect: false }

export class LocalRuntime implements Runtime {
  isolate: ivm.Isolate
  context: ivm.Context

  logger: any
  lastSourceHash: string

  options: LocalRuntimeOptions

  constructor(
    public app: App,
    public bridge: Bridge,
    options: LocalRuntimeOptions = {}
  ) {
    if (!v8Env.snapshot)
      throw new Error("base snapshot is not ready, maybe you need to compile v8env?")

    console.log("new runtime, app:", app.name, app.sourceHash)

    this.options = Object.assign({}, LOCAL_RUNTIME_DEFAULTS, options)

    this.isolate = new ivm.Isolate({
      snapshot: v8Env.snapshot,
      memoryLimit: 128,
      inspector: this.options.inspect
    })

    this.startMonitoring()
    if (this.options.inspect)
      startInspector(this.isolate)

    this.logger = require("console-log-level")({ level: process.env.LOG_LEVEL || 'info' })
    this.context = this.resetContext()
    this.lastSourceHash = app.sourceHash
    if (app.source)
      this.runApp(app)
  }

  get(name: string) {
    return this.context.global.get(name)
  }
  getSync(name: string) {
    return this.context.global.getSync(name)
  }

  set(name: string, value: any) {
    return this.context.global.set(name, value)
  }
  setSync(name: string, value: any) {
    return this.context.global.setSync(name, value)
  }

  private startMonitoring() {
    if (!this.options.monitorFrequency) return; // 0 or undefined
    setInterval(() => {
      if (this.isolate && !this.isolate.isDisposed)
        log.info(`Runtime heap: ${(this.isolate.getHeapStatisticsSync().used_heap_size / (1024 * 1024)).toFixed(2)} MB`)
    }, 5000)
  }

  private resetContext(current?: ivm.Context) {
    if (current)
      current.release()
    const context = this.isolate.createContextSync({ inspector: !!this.options.inspect })
    const g = context.global
    g.setSync("global", g.derefInto())
    g.setSync('_log', new ivm.Reference(function (lvl: string, ...args: any[]) {
      log[lvl](...args)
    }))

    const bootstrap = g.getSync('bootstrap')
    bootstrap.applySync()

    const bootstrapBridge = g.getSync('bootstrapBridge')
    bootstrapBridge.applySync(null, [ivm, new ivm.Reference((name: string, ...args: any[]) => {
      return this.bridge.dispatch(this, name, ...args)
    })])
    return context
  }

  private async runApp(app: App) {
    await this.set("app", app.forV8())
    const script = this.isolate.compileScriptSync(app.source, { filename: "bundle.js" })
    await script.run(this.context)
  }

  async setApp(app: App) {
    if (!app.sourceHash || this.lastSourceHash != app.sourceHash) {
      console.log("Updating app in local runtime...")
      this.app = app
      if (this.lastSourceHash != "") // we had not setup the context
        this.context = this.resetContext(this.context)
      await this.runApp(app)
      this.lastSourceHash = app.sourceHash
    }
  }

  log(lvl: string, ...parts: any[]) {
    this.logger[lvl](...parts)
  }
  reportUsage(name: string, info: any) {
    log.debug(`[usage:${name}]`, inspect(info))
  }
}

async function startInspector(iso: ivm.Isolate) {
  // Create an inspector channel on port 10000
  let channel = iso.createInspectorSession();
  let wss = new WebSocket.Server({ port: 10000 });

  wss.on('connection', function (ws) {
    // Dispose inspector session on websocket disconnect
    let channel = iso.createInspectorSession();
    function dispose() {
      try {
        channel.dispose();
      } catch (err) { }
    }
    ws.on('error', dispose);
    ws.on('close', dispose);

    // Relay messages from frontend to backend
    ws.on('message', function (message) {
      try {
        channel.dispatchProtocolMessage(message);
      } catch (err) {
        // This happens if inspector session was closed unexpectedly
        ws.close();
      }
    });

    // Relay messages from backend to frontend
    function send(message: any) {
      try {
        ws.send(message);
      } catch (err) {
        dispose();
      }
    }
    channel.onResponse = (callId: any, message: any) => send(message);
    channel.onNotification = send;
  });
  console.log('Inspector: chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=127.0.0.1:10000');
}