module.exports = {
  entry: "./index.ts",
  resolve: {
    extensions: [".js", ".ts", ".tsx"],
    alias: {}
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader"
      }
    ]
  }
}
