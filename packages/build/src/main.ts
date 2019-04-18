import * as fs from "fs"
import * as path from "path"
import * as webpack from "webpack"

const UglifyJsPlugin = require("uglifyjs-webpack-plugin")

const webpackConfPath = "./webpack.fly.config.js"

export interface AppBuilderOptions {
  watch: boolean
  uglify?: boolean
}

export function buildApp(cwd: string, opts: AppBuilderOptions, callback: (...args: any[]) => void) {
  buildAppWithConfig(cwd, getWebpackConfig(cwd, opts), opts, callback)
}

export function buildAppWithConfig(
  cwd: string,
  config: webpack.Configuration,
  opts: AppBuilderOptions,
  callback: () => void
) {
  console.info("Compiling app w/ options:", opts)
  const compiler = webpack(config)

  const cb = compileCallback(cwd, compiler, callback)

  if (opts.watch) {
    return compiler.watch({}, cb)
  }

  compiler.run(cb)
}

function compileCallback(cwd: string, compiler: webpack.Compiler, callback: (...args: any[]) => void) {
  let codeHash: string
  return (err: Error, stats: any) => {
    if (err) {
      callback(err)
      return
    }
    if (stats.hasErrors()) {
      callback(
        new Error(
          stats.toString({
            errorDetails: true,
            warnings: true
          })
        )
      )
      return
    }

    if (stats.hash !== codeHash) {
      console.info(`Compiled app bundle (hash: ${stats.hash})`)
      const source = fs.readFileSync(path.resolve(cwd, ".fly/build/bundle.js"))
      const sourceMap = fs.readFileSync(path.resolve(cwd, ".fly/build/bundle.map.json"))
      codeHash = stats.hash
      console.info("Compiled size: ", source.byteLength / (1024 * 1024), "MB")
      console.info("Compiled sourcemap size: ", sourceMap.byteLength / (1024 * 1024), "MB")

      const sanitizedSourceMap = sourceMap
        .toString("utf8")
        .replace("\u2028", "\\u2028") // ugh.
        .replace("\u2029", "\\u2029")

      fs.writeFileSync(path.resolve(cwd, ".fly/build/bundle.map.json"), sanitizedSourceMap)

      callback(null, source.toString("utf8"), codeHash, sanitizedSourceMap)
    }
  }
}

export function getWebpackConfig(cwd: string, opts?: AppBuilderOptions): webpack.Configuration {
  let conf
  const defaultPathToWebpackConfig = path.join(cwd, webpackConfPath)
  if (fs.existsSync(defaultPathToWebpackConfig)) {
    console.info(`Using Webpack config ${defaultPathToWebpackConfig}`)
    conf = require(defaultPathToWebpackConfig)
  } else {
    console.info("Generating Webpack config...")
    conf = {}
  }

  const v8EnvPath = path.dirname(require.resolve("@fly/v8env"))

  conf = {
    entry: getEntryFile(cwd),
    resolve: {
      extensions: [],
      alias: {},
      modules: []
    },
    devtool: "source-map",
    plugins: [],
    module: {
      rules: []
    },
    ...conf
  }

  conf.resolve.extensions = [...(conf.resolve.extensions || []), ".js", ".ts", ".tsx"]
  conf.resolve.modules = [...(conf.resolve.modules || []), "node_modules"]

  conf.module.rules = conf.module.rules || []

  conf.output = {
    filename: "bundle.js",
    path: path.resolve(cwd, ".fly/build"),
    hashFunction: "sha1",
    hashDigestLength: 40,
    sourceMapFilename: "bundle.map.json"
  }

  conf.resolve.alias = {
    ...(conf.resolve.alias || {}),
    "@fly/image": v8EnvPath + "/fly/image",
    "@fly/proxy": v8EnvPath + "/fly/proxy",
    "@fly/data": v8EnvPath + "/fly/data",
    "@fly/cache": v8EnvPath + "/fly/cache",
    "@fly/static": v8EnvPath + "/fly/static",
    "@fly/fetch": v8EnvPath + "/fly/fetch",
    "@fly/v8env$": v8EnvPath,
    "@fly/v8env/lib": v8EnvPath
  }

  conf.resolveLoader = {
    modules: ["node_modules", ...module.paths]
  }

  conf.module.rules.push({
    test: /\.tsx?$/,
    loader: "ts-loader",
    options: {
      transpileOnly: true,
      compilerOptions: {
        paths: {
          "@fly/v8env": [v8EnvPath],
          "@fly/v8env/lib/*": [path.join(v8EnvPath, "*")]
        },
        baseUrl: "."
      }
    }
  })

  if (opts && opts.uglify) {
    conf.plugins = [
      ...conf.plugins,
      new UglifyJsPlugin({
        parallel: true,
        sourceMap: true,
        uglifyOptions: {
          output: { ascii_only: true },
          mangle: false
        }
      })
    ]
  }

  return conf
}

const entryFiles = ["index.ts", "index.js"]

function getEntryFile(cwd: string): string {
  return getEntryFileFromPackageFile(cwd) || getDefaultEntryFile(cwd)
}

function getDefaultEntryFile(cwd: string) {
  for (const entryFile of entryFiles) {
    const entryFilePath = path.join(cwd, entryFile)
    if (fs.existsSync(entryFilePath)) {
      return entryFilePath
    }
  }
}

function getEntryFileFromPackageFile(cwd: string) {
  const packageFilePath = path.join(cwd, "package.json")
  try {
    if (fs.existsSync(packageFilePath)) {
      return require(packageFilePath).main
    }
  } catch (err) {
    console.warn("error reading entry file from package.json", err)
  }
}
