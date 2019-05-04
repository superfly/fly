"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var fs = require("fs");
// import * as glob from "glob"
var path = require("path");
// import * as tar from "tar-fs"
var webpack = require("webpack");
var UglifyJsPlugin = require("uglifyjs-webpack-plugin");
var webpackConfPath = "./webpack.fly.config.js";
function buildApp(options) {
    var webpackConfig = getWebpackConfig(options);
    if (!options.outputPath) {
        options.outputPath = path.resolve(options.inputPath, ".fly/build");
    }
    console.info("Compiling app w/ options:", options);
    var compiler = webpack(webpackConfig);
    return new Promise(function (resolve, reject) {
        compiler.run(function (err, stats) {
            handleWebpackCallback(err, stats, resolve, reject);
        });
    });
}
exports.buildApp = buildApp;
function buildAndWatchApp(options, onSuccess, onError) {
    var webpackConfig = getWebpackConfig(options);
    if (!options.outputPath) {
        options.outputPath = path.resolve(options.inputPath, ".fly/build");
    }
    console.info("Compiling app w/ options:", options);
    var compiler = webpack(webpackConfig);
    compiler.watch({}, function (err, stats) {
        handleWebpackCallback(err, stats, onSuccess, onError);
    });
}
exports.buildAndWatchApp = buildAndWatchApp;
function handleWebpackCallback(err, stats, onSuccess, onError) {
    if (err) {
        return onError(err);
    }
    if (stats.hasErrors()) {
        return onError(new Error(stats.toString({ errorDetails: true, warnings: true })));
    }
    var compilation = stats.compilation;
    var outputOptions = compilation.outputOptions;
    var outputPath = outputOptions.path;
    var sourcePath = path.join(outputPath, outputOptions.filename);
    var sourceMapPath = path.join(outputPath, outputOptions.sourceMapFilename);
    var configFilePath = fs.existsSync(path.resolve(".fly", ".fly.yml")) ? ".fly/.fly.yml" : ".fly.yml";
    sanitizeSourceMapOutput(sourceMapPath); // why do we need this!?!?
    var source = fs.readFileSync(sourcePath);
    var sourceMap = fs.readFileSync(sourceMapPath);
    onSuccess({
        time: stats.endTime - stats.startTime,
        configFilePath: configFilePath,
        source: {
            text: source.toString("utf8"),
            path: sourcePath,
            digest: stats.hash,
            byteLength: source.byteLength
        },
        sourceMap: {
            text: sourceMap.toString("utf8"),
            path: sourceMapPath,
            byteLength: sourceMap.byteLength
        }
    });
}
function getWebpackConfig(options) {
    var inputPath = options.inputPath, outputPath = options.outputPath;
    console.log("getWebpackConfig", { inputPath: inputPath, webpackConfPath: webpackConfPath });
    var conf;
    var defaultPathToWebpackConfig = path.join(inputPath, webpackConfPath);
    if (fs.existsSync(defaultPathToWebpackConfig)) {
        console.info("Using Webpack config " + defaultPathToWebpackConfig);
        conf = require(defaultPathToWebpackConfig);
    }
    else {
        console.info("Generating Webpack config...");
        conf = {};
    }
    var v8EnvPath = path.dirname(require.resolve("@fly/v8env"));
    conf = __assign({ entry: options.entry || getEntryFile(inputPath), resolve: {
            extensions: [],
            alias: {},
            modules: []
        }, devtool: "source-map", plugins: [], module: {
            rules: []
        } }, conf);
    conf.resolve.extensions = (conf.resolve.extensions || []).concat([".js", ".ts", ".tsx"]);
    conf.resolve.modules = (conf.resolve.modules || []).concat(["node_modules"]);
    conf.module.rules = conf.module.rules || [];
    conf.output = {
        filename: "bundle.js",
        path: outputPath,
        hashFunction: "sha1",
        hashDigestLength: 40,
        sourceMapFilename: "bundle.map.json"
    };
    conf.resolve.alias = __assign({}, (conf.resolve.alias || {}), { "@fly/image": v8EnvPath + "/fly/image", "@fly/proxy": v8EnvPath + "/fly/proxy", "@fly/data": v8EnvPath + "/fly/data", "@fly/cache": v8EnvPath + "/fly/cache", "@fly/static": v8EnvPath + "/fly/static", "@fly/fetch": v8EnvPath + "/fly/fetch", "@fly/v8env$": v8EnvPath, "@fly/v8env/lib": v8EnvPath });
    conf.resolveLoader = {
        modules: ["node_modules"].concat(module.paths)
    };
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
    });
    if (options.uglify) {
        conf.plugins = conf.plugins.concat([
            new UglifyJsPlugin({
                parallel: true,
                sourceMap: true,
                uglifyOptions: {
                    output: { ascii_only: true },
                    mangle: false
                }
            })
        ]);
    }
    console.log("webpack config", { conf: conf });
    return conf;
}
exports.getWebpackConfig = getWebpackConfig;
var entryFiles = ["index.ts", "index.js"];
function getEntryFile(inputPath) {
    return getEntryFileFromPackageFile(inputPath) || getDefaultEntryFile(inputPath) || "index.js";
}
function getDefaultEntryFile(inputPath) {
    for (var _i = 0, entryFiles_1 = entryFiles; _i < entryFiles_1.length; _i++) {
        var entryFile = entryFiles_1[_i];
        var entryFilePath = path.join(inputPath, entryFile);
        if (fs.existsSync(entryFilePath)) {
            return entryFilePath;
        }
    }
}
function getEntryFileFromPackageFile(cwd) {
    var packageFilePath = path.join(cwd, "package.json");
    try {
        if (fs.existsSync(packageFilePath)) {
            var packageJson = require(packageFilePath);
            if (packageJson.main) {
                return path.resolve(cwd, packageJson.main);
            }
        }
    }
    catch (err) {
        console.warn("error reading entry file from package.json", err);
    }
}
function sanitizeSourceMapOutput(sourceMapPath) {
    var sanitizedSourceMap = fs
        .readFileSync(sourceMapPath)
        .toString("utf8")
        .replace("\u2028", "\\u2028") // ugh.
        .replace("\u2029", "\\u2029");
    fs.writeFileSync(sourceMapPath, sanitizedSourceMap);
}
