import { root } from "./root"
import { Command } from "commandpost/lib"
import * as path from "path"
import * as fs from "fs"
import { spawn } from "child_process"

interface DNSOptions {
  port?: string
}

interface DNSArguments {
  path?: string
}

root
  .subCommand<DNSOptions, DNSArguments>("dns [path]")
  .description("Run the Fly DNS server")
  .option("-p, --port <port>", "Port to bind to")
  .action(async function (this: Command<DNSOptions, DNSArguments>, opts, args, rest) {
    const execPath = path.join(__dirname, "../../bin/fly-dns")
    if (!fs.existsSync(execPath))
      throw new Error("fly-dns does not exist, probably unavailable for your platform")
    let procArgs: string[] = []
    if (opts.port && opts.port.length > 0)
      procArgs = procArgs.concat(["--port", opts.port[0].toString()])
    let proc = spawn(execPath, procArgs.concat(args.path ? [args.path] : []));
    proc.stdout.pipe(process.stdout);
    proc.stderr.pipe(process.stderr);
  })