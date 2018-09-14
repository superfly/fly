module.exports = {
  entry: `./tests/index.js`,
  resolve: {
    extensions: ['.js', '.png']
  },
  module: {
    rules: [
      {
        test: /\.(ico|svg|png|jpg|gif)$/,
        use: ['arraybuffer-loader', 'image-webpack-loader']
      }
    ]
  }
}