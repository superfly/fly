let path = require('path')
module.exports = {
  entry: path.join(__dirname, "v8env", "index"),
  devtool: 'source-map',
  output: {
    filename: 'v8env.js',
    sourceMapFilename: 'v8env.map.json',
    hashFunction: 'sha1',
    hashDigestLength: 40,
    path: path.join(__dirname, '/dist/')
  },
  resolve: {
    modules: ["../node_modules"],
    extensions: [".ts", ".tsx", ".js"]
  },
  module: {
    loaders: [
      { test: /\.tsx?/, loader: "ts-loader" }
    ]
  }
}