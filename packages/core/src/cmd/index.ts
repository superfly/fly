#!/usr/bin/env node

import { root } from "./root"

require("./new")
require("./apps")
require("./orgs")
require("./deploy")
require("./releases")
require("./secrets")
require("./test")
require("./server")
require("./hostnames")
require("./login")
require("./fetch")
require("./logs")

const SegfaultHandler = require("segfault-handler")
SegfaultHandler.registerHandler("crash.log")

import { exec } from "commandpost"

exec(root, process.argv).catch(err => {
  if (err instanceof Error) {
    console.error(err.stack)
  } else {
    console.error(err)
  }
  process.exit(1)
})
