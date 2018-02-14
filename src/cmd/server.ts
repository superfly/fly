import * as path from 'path'

import { root } from './root'
import log from '../log'
import { IncomingMessage } from 'http';
import { ServerResponse } from 'http';
import { Trace } from '../trace';
import { ivm } from '../';

import * as WebSocket from 'ws';

interface ServerOptions {
  port?: string
  inspect?: boolean
  uglify: boolean
}

root
  .subCommand<ServerOptions, any>("server")
  .description("Run the local Fly development server")
  .option("-p, --port <port>", "Port to bind to")
  .option("--inspect", "use the v8 inspector on your fly app")
  .option("--uglify", "uglify your code like we'll use in production (warning: slow!)")
  .action((opts, args, rest) => {
    const { parseConfig } = require('../config')
    const { FileStore } = require('../app/stores/file')
    const { Server } = require('../server')
    const { DefaultContextStore } = require('../default_context_store');

    const cwd = process.cwd()
    let conf = parseConfig(cwd)

    if (opts.port && opts.port.length) { conf.port = opts.port }

    conf.appStore = new FileStore(cwd, { build: true, uglify: opts.uglify, env: "development" })

    if (!!opts.inspect) {
      conf.contextStore = new DefaultContextStore({ inspect: true })
      startInspector(conf.contextStore)
    }

    const server = new Server(conf, !!opts.inspect ? { fetchDispatchTimeout: 0, fetchEndTimeout: 0 } : {})
    server.addListener("requestEnd", (req: IncomingMessage, res: ServerResponse, trace: Trace) => {
      log.debug(trace.report())
    })
    server.start()
  })

async function startInspector(ctxStore: any) {
  // Create an inspector channel on port 10000
  let iso = await ctxStore.getIsolate()
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