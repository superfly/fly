#!/usr/bin/env node

import { root, getToken } from './root';

// require("./apps");
// require("./orgs");
// require("./deploy");
// require("./releases");
// require("./secrets");
require("./test");
require("./server");
// require("./hostnames");
// require("./login");
// require("./fetch");
// require("./logs");

var SegfaultHandler = require('segfault-handler');
SegfaultHandler.registerHandler("crash.log");

process.on('uncaughtException', err => console.error('uncaught exception:', err.stack));
process.on('unhandledRejection', err => console.error('unhandled rejection:', err.stack));

root.getOptions(true)
