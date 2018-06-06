module.exports = {
  module: {
    loaders: [
      {
        test: /\.asc\.ts$/,
        exclude: '/node_modules/',
        loader: 'assemblyscript-live-loader'
      }
    ]
  },
}