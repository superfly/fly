let path = require("path")

module.exports = {
  entry: path.join(__dirname, "src", "index"),
  devtool: "source-map",
  output: {
    filename: "nodeproxy-shim.js",
    sourceMapFilename: "nodeproxy-shim.map.json",
    hashFunction: "sha1",
    hashDigestLength: 40,
    path: path.join(__dirname, "/dist/")
  },
  resolve: {
    modules: ["node_modules", "../../node_modules", "vendor"],
    extensions: [".ts", ".tsx", ".js"],
    alias: {
      "readable-stream": path.resolve(__dirname, "src/streams")
    }
  },
  node: {
    fs: "empty"
  },
  module: {
    rules: [{ test: /\.tsx?/, use: "ts-loader" }]
  }
}
