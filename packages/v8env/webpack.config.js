let path = require("path")
module.exports = {
  entry: path.join(__dirname, "lib", "index"),
  devtool: "source-map",
  mode: "production",
  output: {
    filename: "v8env.js",
    sourceMapFilename: "v8env.map.json",
    hashFunction: "sha1",
    hashDigestLength: 40,
    path: path.join(__dirname, "/dist/")
  },
  resolve: {
    modules: ["node_modules", "../../node_modules", "vendor"],
    extensions: [".ts", ".tsx", ".js"],
    alias: {
      "@fly/image": path.resolve(__dirname, "./lib/fly/image"),
      "@fly/data": path.resolve(__dirname, "./lib/fly/data"),
      "@fly/cache": path.resolve(__dirname, "./lib/fly/cache")
    }
  },
  node: {
    fs: "empty"
  },
  module: {
    rules: [{ test: /\.tsx?/, loader: "ts-loader" }]
  }
}
