import Command, { flags } from "@oclif/command"

export abstract class FlyCommand extends Command {
  // static flags = {
  //   loglevel: flags.string({ options: ["error", "warn", "info", "debug"] })
  // }
  // log(msg, level) {
  //   switch (this.flags.loglevel) {
  //     case "error":
  //       if (level === "error") console.error(msg)
  //       break
  //     // a complete example would need to have all the levels
  //   }
  // }
  // async init(err) {
  //   // do some initialization
  //   const { flags } = this.parse(this.constructor)
  //   this.flags = flags
  // }
  // async catch(err: any) {
  //   console.log("CAUGHT ERROR", { err })
  //   if (err && err.response && err.response.data) {
  //     this.error(`API Error: ${err.response.data}`, { exit: 1 })
  //   } else {
  //     this.error(err, { exit: 1 })
  //   }
  // }
  // async finally(err) {
  //   // called after run and catch regardless of whether or not the command errored
  // }
}
