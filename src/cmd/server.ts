import * as path from 'path'

import { root } from './root'
import log from '../log'
import { IncomingMessage } from 'http';
import { ServerResponse } from 'http';
import { Trace } from '../trace';
import { ivm } from '../';

import * as WebSocket from 'ws';
import { DefaultContextStore } from '../default_context_store';

interface ServerOptions {
  port?: string
  inspect?: boolean
  uglify: boolean
}

interface ServerArguments {
  path?: string
}

root
  .subCommand<ServerOptions, ServerArguments>("server [path]")
  .description("Run the local Fly development server")
  .option("-p, --port <port>", "Port to bind to")
  .option("--inspect", "use the v8 inspector on your fly app")
  .option("--uglify", "uglify your code like we'll use in production (warning: slow!)")
  .action((opts, args, rest) => {
    const { FileAppStore } = require('../file_app_store')
    const { Server } = require('../server')
    const { DefaultContextStore } = require('../default_context_store');

    const cwd = args.path || process.cwd()

    const port = opts.port && opts.port[0] || 3000

    const appStore = new FileAppStore(cwd, { build: true, uglify: opts.uglify, env: "development" })

    let contextStore: DefaultContextStore;
    if (!!opts.inspect) {
      contextStore = new DefaultContextStore({ inspect: true })
      startInspector(contextStore)
    } else {
      contextStore = new DefaultContextStore
    }

    const server = new Server({ contextStore, appStore })
    server.listen(port)
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