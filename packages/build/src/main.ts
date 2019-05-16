import * as fs from "fs"
import * as path from "path"
import * as webpack from "webpack"

const UglifyJsPlugin = require("uglifyjs-webpack-plugin")

const webpackConfPath = "./webpack.fly.config.js"

export interface BuildOptions {
  inputPath: string
  outputPath: string
  uglify?: boolean
  entry?: string | string[]
}

export interface BuildInfo {
  time: number
  source: {
    text: string
    path: string
    digest: string
    byteLength: number
  }
  sourceMap: {
    text: string
    path: string
    byteLength: number
  }
}

export function buildApp(options: BuildOptions): Promise<BuildInfo> {
  const webpackConfig = getWebpackConfig(options)
  const compiler = webpack(webpackConfig)

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      handleWebpackCallback(err, stats, resolve, reject)
    })
  })
}

export function buildAndWatchApp(
  options: BuildOptions,
  onSuccess: (info: BuildInfo) => void,
  onError: (err: Error) => void
) {
  const webpackConfig = getWebpackConfig(options)
  const compiler = webpack(webpackConfig)

  compiler.watch({}, (err, stats) => {
    handleWebpackCallback(err, stats, onSuccess, onError)
  })
}

function handleWebpackCallback(
  err: Error,
  stats: webpack.Stats,
  onSuccess: (info: BuildInfo) => void,
  onError: (err: Error) => void
) {
  if (err) {
    return onError(err)
  }
  if (stats.hasErrors()) {
    return onError(new Error(stats.toString({ errorDetails: true, warnings: true })))
  }

  const compilation = (stats as any).compilation
  const outputOptions = compilation.outputOptions
  const outputPath = outputOptions.path
  const sourcePath = path.join(outputPath, outputOptions.filename)
  const sourceMapPath = path.join(outputPath, outputOptions.sourceMapFilename!)
  sanitizeSourceMapOutput(sourceMapPath) // why do we need this!?!?
  const source = fs.readFileSync(sourcePath)
  const sourceMap = fs.readFileSync(sourceMapPath)

  onSuccess({
    time: (stats as any).endTime - (stats as any).startTime,
    source: {
      text: source.toString("utf8"),
      path: sourcePath,
      digest: (stats as any).hash,
      byteLength: source.byteLength
    },
    sourceMap: {
      text: sourceMap.toString("utf8"),
      path: sourceMapPath,
      byteLength: sourceMap.byteLength
    }
  })
}

export function getWebpackConfig(options: BuildOptions): webpack.Configuration {
  const { inputPath, outputPath } = options
  let conf
  const defaultPathToWebpackConfig = path.join(inputPath, webpackConfPath)
  if (fs.existsSync(defaultPathToWebpackConfig)) {
    console.info(`Using Webpack config ${defaultPathToWebpackConfig}`)
    conf = require(defaultPathToWebpackConfig)
  } else {
    console.info("Generating Webpack config...")
    conf = {}
  }

  const v8EnvPath = path.dirname(require.resolve("@fly/v8env"))

  conf = {
    entry: getEntryFile(inputPath),
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

  conf.entry = options.entry || conf.entry
  conf.resolve.extensions = [...(conf.resolve.extensions || []), ".js", ".ts", ".tsx"]
  conf.resolve.modules = [...(conf.resolve.modules || []), "node_modules"]

  conf.module.rules = conf.module.rules || []

  conf.output = {
    filename: "fly-bundle.js",
    path: outputPath,
    hashFunction: "sha1",
    hashDigestLength: 40,
    sourceMapFilename: "fly-bundle.map.json"
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

  if (options.uglify) {
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

  // console.debug("webpack config", { conf })

  return conf
}

const entryFiles = ["index.ts", "index.js"]

function getEntryFile(inputPath: string): string {
  return getEntryFileFromPackageFile(inputPath) || getDefaultEntryFile(inputPath) || "index.js"
}

function getDefaultEntryFile(inputPath: string) {
  for (const entryFile of entryFiles) {
    const entryFilePath = path.join(inputPath, entryFile)
    if (fs.existsSync(entryFilePath)) {
      return entryFilePath
    }
  }
}

function getEntryFileFromPackageFile(cwd: string) {
  const packageFilePath = path.join(cwd, "package.json")
  try {
    if (fs.existsSync(packageFilePath)) {
      const packageJson = require(packageFilePath)
      if (packageJson.main) {
        return path.resolve(cwd, packageJson.main)
      }
    }
  } catch (err) {
    console.warn("error reading entry file from package.json", err)
  }
}

function sanitizeSourceMapOutput(sourceMapPath: string) {
  const sanitizedSourceMap = fs
    .readFileSync(sourceMapPath)
    .toString("utf8")
    .replace("\u2028", "\\u2028") // ugh.
    .replace("\u2029", "\\u2029")

  fs.writeFileSync(sourceMapPath, sanitizedSourceMap)
}
