module.exports = {
  entry: './src/index.js',
  resolve: {
    extensions: ['.js']
  },
  output: {
    filename: 'fly-env.js',
    path: __dirname
  }
}