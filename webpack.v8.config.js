let path = require('path')
module.exports = {
  entry: path.join(__dirname, "v8env", "lib", "index"),
  devtool: 'source-map',
  output: {
    filename: 'v8env.js',
    sourceMapFilename: 'v8env.map.json',
    hashFunction: 'sha1',
    hashDigestLength: 40,
    path: path.join(__dirname, '/dist/')
  },
  resolve: {
    modules: ["../node_modules", "../vendor"],
    extensions: [".ts", ".tsx", ".js"],
    alias: {
      "@fly/image": path.resolve(__dirname, "./v8env/lib/fly/image"),
      "@fly/data": path.resolve(__dirname, "./v8env/lib/fly/data"),
      "@fly/cache": path.resolve(__dirname, "./v8env/lib/fly/cache")
    }
  },
  node: {
    fs: 'empty'
  },
  module: {
    loaders: [
      { test: /\.tsx?/, loader: "ts-loader" }
    ]
  }
}