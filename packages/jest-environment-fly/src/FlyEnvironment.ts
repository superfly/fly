// import { Environment } from "./Runtime";

// import { NodeEnvironment } from "jest-environment-node"

const NodeEnvironment = require("jest-environment-node")

// console.log("DOInG IT", NodeEnvironment)

class FlyEnvironment extends NodeEnvironment {
  constructor(config: any) {
    super(config)

    throw new Error(JSON.stringify(config))
    // console.log(config)

    // const x = new Environment({
    //   testName: "hello",
    //   testDir: "./",
    //   servers: [

    //   ]
    // })
  }

  setup() {
    console.log("FlyTestEnvironment.SETUP")
    return Promise.resolve()
  }

  teardown() {
    console.log("FlyTestEnvironment.Teardown")
    return Promise.resolve()
  }
}

export default FlyEnvironment

// module.exports