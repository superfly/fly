# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="0.33.4"></a>
## [0.33.4](https://github.com/superfly/fly/compare/v0.33.3...v0.33.4) (2018-06-13)


### Bug Fixes

* fly.cache.set returns true when successful in dev mode (closes [#88](https://github.com/superfly/fly/issues/88)) ([5b9778a](https://github.com/superfly/fly/commit/5b9778a))
* gzip application/json ([68a9535](https://github.com/superfly/fly/commit/68a9535))



<a name="0.33.3"></a>
## [0.33.3](https://github.com/superfly/fly/compare/v0.33.3-1...v0.33.3) (2018-06-09)



<a name="0.33.2"></a>
## [0.33.2](https://github.com/superfly/fly/compare/v0.33.1...v0.33.2) (2018-06-05)


### Bug Fixes

* (proxy) send host header from origin by default ([306ea2d](https://github.com/superfly/fly/commit/306ea2d)), closes [#83](https://github.com/superfly/fly/issues/83)



<a name="0.33.1"></a>
## [0.33.1](https://github.com/superfly/fly/compare/v0.33.1-1...v0.33.1) (2018-05-24)



<a name="0.33.1-1"></a>
## [0.33.1-1](https://github.com/superfly/fly/compare/v0.33.1-0...v0.33.1-1) (2018-05-24)



<a name="0.33.1-0"></a>
## [0.33.1-0](https://github.com/superfly/fly/compare/v0.33.0...v0.33.1-0) (2018-05-24)



<a name="0.33.0"></a>
# [0.33.0](https://github.com/superfly/fly/compare/v0.31.0...v0.33.0) (2018-05-24)


### Bug Fixes

* node 10 support, easier windows installs hopefully ([f391bf8](https://github.com/superfly/fly/commit/f391bf8))


### Features

* [@fly](https://github.com/fly)/proxy for sending requests to origin servers ([#81](https://github.com/superfly/fly/issues/81)) ([cc2c1d9](https://github.com/superfly/fly/commit/cc2c1d9))



<a name="0.32.0"></a>
# [0.32.0](https://github.com/superfly/fly/compare/v0.31.0...v0.32.0) (2018-05-21)


### Features

* [@fly](https://github.com/fly)/proxy for sending requests to origin servers ([#81](https://github.com/superfly/fly/issues/81)) ([cc2c1d9](https://github.com/superfly/fly/commit/cc2c1d9))



<a name="0.31.0"></a>
# [0.31.0](https://github.com/superfly/fly/compare/v0.30.0-0...v0.31.0) (2018-05-09)


### Bug Fixes

* don't mangle names ([864456a](https://github.com/superfly/fly/commit/864456a))


### Features

* Document Node#appendChild ([96ea89e](https://github.com/superfly/fly/commit/96ea89e))



<a name="0.30.0"></a>
# [0.30.0](https://github.com/superfly/fly/compare/v0.30.0-0...v0.30.0) (2018-05-04)


### Bug Fixes

* don't mangle names ([864456a](https://github.com/superfly/fly/commit/864456a))

### Features

* `crypto.getRandomValues()` for Uint8Array


<a name="0.29.2"></a>
## [0.29.2](https://github.com/superfly/fly/compare/v0.29.1...v0.29.2) (2018-05-01)


### Bug Fixes

* inflate gzip stream race condition causes early closes ([42581bb](https://github.com/superfly/fly/commit/42581bb))
* response time was always 0 because trace was not done ([d6b2c2f](https://github.com/superfly/fly/commit/d6b2c2f))
* throw useful error when fly.http.respondWith gets the wrong type (fixes [#65](https://github.com/superfly/fly/issues/65)) ([#78](https://github.com/superfly/fly/issues/78)) ([83a6c08](https://github.com/superfly/fly/commit/83a6c08))


### Features

* Automatically gzip response bodies when appropriate ([2f066ca](https://github.com/superfly/fly/commit/2f066ca))
* use [@fly](https://github.com/fly)/ namespace for internal requires, less globals ([#73](https://github.com/superfly/fly/issues/73)) ([4015038](https://github.com/superfly/fly/commit/4015038))



<a name="0.28.4"></a>
## [0.28.4](https://github.com/superfly/fly/compare/v0.28.3...v0.28.4) (2018-04-13)


### Bug Fixes

* create image from scrach with `new Image({width, height, ...})`" ([8641f13](https://github.com/superfly/fly/commit/8641f13))



<a name="0.28.3"></a>
## [0.28.3](https://github.com/superfly/fly/compare/v0.28.2...v0.28.3) (2018-04-12)


### Bug Fixes

* allow CLI options throughout subcommands, add move and destroy apps subcommand ([26edf5a](https://github.com/superfly/fly/commit/26edf5a))



<a name="0.28.2"></a>
## [0.28.2](https://github.com/superfly/fly/compare/v0.28.1...v0.28.2) (2018-04-12)


### Bug Fixes

* don't try to parse metadata ([cab9667](https://github.com/superfly/fly/commit/cab9667))



<a name="0.28.1"></a>
## [0.28.1](https://github.com/superfly/fly/compare/v0.28.0...v0.28.1) (2018-04-10)


### Bug Fixes

* add missing flatten and jpeg image calls ([c344847](https://github.com/superfly/fly/commit/c344847))



<a name="0.28.0"></a>
# [0.28.0](https://github.com/superfly/fly/compare/v0.27.1...v0.28.0) (2018-04-09)


### Bug Fixes

* Support all TypedArray Response/Request bodies ([#54](https://github.com/superfly/fly/issues/54)) ([332356c](https://github.com/superfly/fly/commit/332356c))
* test command was broken with cwd changes ([67024ac](https://github.com/superfly/fly/commit/67024ac))


### Features

* Add APIs for watermarking images ([#55](https://github.com/superfly/fly/issues/55)) ([942ccea](https://github.com/superfly/fly/commit/942ccea))



<a name="0.27.2"></a>
## [0.27.2](https://github.com/superfly/fly/compare/v0.27.1...v0.27.2) (2018-04-06)


### Bug Fixes

* test command was broken with cwd changes ([67024ac](https://github.com/superfly/fly/commit/67024ac))



<a name="0.27.1"></a>
## [0.27.1](https://github.com/superfly/fly/compare/v0.26.7-0...v0.27.1) (2018-04-06)


### Bug Fixes

* Support Uint8Array Response bodies ([#52](https://github.com/superfly/fly/issues/52)) ([8e73481](https://github.com/superfly/fly/commit/8e73481))



<a name="0.27.0"></a>
# [0.27.0](https://github.com/superfly/fly/compare/v0.26.7-0...v0.27.0) (2018-04-05)

### Features

* Basic `crypto` API (`crypto.subtle.digest`)
* Cut v8env weight in half by removing text-encoding and spark-md5 packages


<a name="0.26.7-0"></a>
## [0.26.7-0](https://github.com/superfly/fly/compare/v0.26.6...v0.26.7-0) (2018-03-31)


### Bug Fixes

* cache.get in development mode was screwing up string <-> buffer because of an apparent node bug ([6aeb976](https://github.com/superfly/fly/commit/6aeb976))



<a name="0.26.6"></a>
## [0.26.6](https://github.com/superfly/fly/compare/v0.26.5...v0.26.6) (2018-03-23)


### Bug Fixes

* allow longer fetch timeout ([74ffa30](https://github.com/superfly/fly/commit/74ffa30))



<a name="0.26.5"></a>
## [0.26.5](https://github.com/superfly/fly/compare/v0.26.5-0...v0.26.5) (2018-03-22)



<a name="0.26.5-0"></a>
## [0.26.5-0](https://github.com/superfly/fly/compare/v0.26.4...v0.26.5-0) (2018-03-21)



<a name="0.26.4"></a>
## [0.26.4](https://github.com/superfly/fly/compare/v0.26.4-1...v0.26.4) (2018-03-20)



<a name="0.26.4-1"></a>
## [0.26.4-1](https://github.com/superfly/fly/compare/v0.26.4-0...v0.26.4-1) (2018-03-20)



<a name="0.26.4-0"></a>
## [0.26.4-0](https://github.com/superfly/fly/compare/v0.26.3...v0.26.4-0) (2018-03-19)


### Bug Fixes

* don't need to keep track of most releasables in v8, just release them on the spot ([2d9f53f](https://github.com/superfly/fly/commit/2d9f53f))



<a name="0.26.3"></a>
## [0.26.3](https://github.com/superfly/fly/compare/v0.26.3-0...v0.26.3) (2018-03-19)



<a name="0.26.3-0"></a>
## [0.26.3-0](https://github.com/superfly/fly/compare/v0.26.2...v0.26.3-0) (2018-03-17)


### Bug Fixes

* app with invalid sourcemap still runs ([#45](https://github.com/superfly/fly/issues/45)) ([9b5bbaf](https://github.com/superfly/fly/commit/9b5bbaf))



<a name="0.26.2"></a>
## [0.26.2](https://github.com/superfly/fly/compare/v0.26.0...v0.26.2) (2018-03-16)


### Bug Fixes

* Including getting-started app in npm ([db5e501](https://github.com/superfly/fly/commit/db5e501))
* optional callback may prevent context from finalizing ([b264d6c](https://github.com/superfly/fly/commit/b264d6c))
* send sni with https fetch requests ([de6aac5](https://github.com/superfly/fly/commit/de6aac5))
* tracked down a plugged a memory leak ([e860ff1](https://github.com/superfly/fly/commit/e860ff1))



<a name="0.26.1"></a>
## [0.26.1](https://github.com/superfly/fly/compare/v0.26.0...v0.26.1) (2018-03-15)


### Bug Fixes

* optional callback may prevent context from finalizing ([f4353cc](https://github.com/superfly/fly/commit/f4353cc))



<a name="0.26.0"></a>
# [0.26.0](https://github.com/superfly/fly/compare/v0.24.1...v0.26.0) (2018-03-15)


### Bug Fixes

* end httpRequest trace [ci skip] ([0718f06](https://github.com/superfly/fly/commit/0718f06))
* lingering callback was causing a memory leak ([054f75f](https://github.com/superfly/fly/commit/054f75f))
* more red in CLI errors messages [ci skip] ([3ec39b3](https://github.com/superfly/fly/commit/3ec39b3))
* rewrite source map file to remove unsupported characters ([68fea9e](https://github.com/superfly/fly/commit/68fea9e))


### Features

* API docs published with npm ([#44](https://github.com/superfly/fly/issues/44)) ([be7e013](https://github.com/superfly/fly/commit/be7e013))
* Image.metadata() returns a promise with image info ([5ddde44](https://github.com/superfly/fly/commit/5ddde44))
* Simplify and reorganize for more flexibility ([#43](https://github.com/superfly/fly/issues/43)) ([14dca88](https://github.com/superfly/fly/commit/14dca88))



<a name="0.25.0"></a>
# [0.25.0](https://github.com/superfly/fly/compare/v0.24.1...v0.25.0) (2018-03-13)


### Bug Fixes

* more red in CLI errors messages [ci skip] ([3ec39b3](https://github.com/superfly/fly/commit/3ec39b3))


### Features

* Image.metadata() returns a promise with image info ([5ddde44](https://github.com/superfly/fly/commit/5ddde44))
* Simplify and reorganize for more flexibility ([#43](https://github.com/superfly/fly/issues/43)) ([14dca88](https://github.com/superfly/fly/commit/14dca88))



<a name="0.24.1"></a>
## [0.24.1](https://github.com/superfly/fly/compare/v0.24.0...v0.24.1) (2018-03-08)


### Bug Fixes

* revert to isolated-vm 1.0.2 for now ([43fc178](https://github.com/superfly/fly/commit/43fc178))



<a name="0.24.0"></a>
# [0.24.0](https://github.com/superfly/fly/compare/v0.23.0...v0.24.0) (2018-03-08)


### Features

* Include files in releases ([#42](https://github.com/superfly/fly/issues/42)) ([1dd6fe3](https://github.com/superfly/fly/commit/1dd6fe3))



<a name="0.24.0-0"></a>
# [0.24.0-0](https://github.com/superfly/fly/compare/v0.23.0...v0.24.0-0) (2018-03-08)


### Bug Fixes

* forgot a mention of FileStore -> FileAppStore ([8f0469a](https://github.com/superfly/fly/commit/8f0469a))


### Features

* Include files in releases ([7984650](https://github.com/superfly/fly/commit/7984650))



<a name="0.23.0"></a>
# [0.23.0](https://github.com/superfly/fly/compare/v0.22.0...v0.23.0) (2018-03-08)


### Features

* Add image API ([#41](https://github.com/superfly/fly/issues/41)) ([f0795b1](https://github.com/superfly/fly/commit/f0795b1))



<a name="0.22.0"></a>
# [0.22.0](https://github.com/superfly/fly/compare/v0.22.0-0...v0.22.0) (2018-03-04)



<a name="0.22.0-0"></a>
# [0.22.0-0](https://github.com/superfly/fly/compare/v0.21.0...v0.22.0-0) (2018-03-04)


### Features

* Change app naming scheme to be simpler ([#39](https://github.com/superfly/fly/issues/39)) ([be16113](https://github.com/superfly/fly/commit/be16113))



<a name="0.21.0"></a>
# [0.21.0](https://github.com/superfly/fly/compare/v0.20.2...v0.21.0) (2018-03-03)


### Bug Fixes

* logs command incorrectly decided a good response was bad ([4513968](https://github.com/superfly/fly/commit/4513968))


### Features

* Add Blob implementation ([60c45e6](https://github.com/superfly/fly/commit/60c45e6))
* Bring back FormData API ([#34](https://github.com/superfly/fly/issues/34)) ([e68dbdd](https://github.com/superfly/fly/commit/e68dbdd))
* use webpack.fly.config.js instead of webpack.config.js ([2d26c85](https://github.com/superfly/fly/commit/2d26c85))



<a name="0.20.2"></a>
## [0.20.2](https://github.com/superfly/fly/compare/v0.20.1...v0.20.2) (2018-02-28)


### Bug Fixes

* body not cloned on `new Request(req)` ([2ec0b99](https://github.com/superfly/fly/commit/2ec0b99))



<a name="0.20.1"></a>
## [0.20.1](https://github.com/superfly/fly/compare/v0.20.0...v0.20.1) (2018-02-28)


### Bug Fixes

* contexts are never released, causing hang ([296eac8](https://github.com/superfly/fly/commit/296eac8))
* don't clear context.meta on finalize, production needs that ([1c2ef6d](https://github.com/superfly/fly/commit/1c2ef6d))



<a name="0.20.0"></a>
# [0.20.0](https://github.com/superfly/fly/compare/v0.19.2...v0.20.0) (2018-02-28)


### Features

* Document parser has been brought back ([#33](https://github.com/superfly/fly/issues/33)) ([aa0c6fe](https://github.com/superfly/fly/commit/aa0c6fe))
* Efficient request bodies, proxy large requests, speed++ ([1f2346f](https://github.com/superfly/fly/commit/1f2346f))



<a name="0.19.3-2"></a>
## [0.19.3-2](https://github.com/superfly/fly/compare/v0.19.3-1...v0.19.3-2) (2018-02-28)



<a name="0.19.3-1"></a>
## [0.19.3-1](https://github.com/superfly/fly/compare/v0.19.2...v0.19.3-1) (2018-02-28)



<a name="0.19.3-0"></a>
## [0.19.3-0](https://github.com/superfly/fly/compare/v0.19.2...v0.19.3-0) (2018-02-28)



<a name="0.19.2"></a>
## [0.19.2](https://github.com/superfly/fly/compare/v0.19.1...v0.19.2) (2018-02-27)


### Bug Fixes

* use passed env in options from app file store if any ([3ab8660](https://github.com/superfly/fly/commit/3ab8660))



<a name="0.19.1"></a>
## [0.19.1](https://github.com/superfly/fly/compare/v0.19.0...v0.19.1) (2018-02-27)


### Bug Fixes

* better test run, dispatch with callback enables finalization ([953cd0c](https://github.com/superfly/fly/commit/953cd0c))



<a name="0.19.0"></a>
# [0.19.0](https://github.com/superfly/fly/compare/v0.18.1...v0.19.0) (2018-02-27)


### Bug Fixes

* **cli:** display an error message if app doesn't have logs, yet ([#28](https://github.com/superfly/fly/issues/28)) ([7e12766](https://github.com/superfly/fly/commit/7e12766))


### Features

* **store:** provide config environment as `app.env` during runtime ([#23](https://github.com/superfly/fly/issues/23)) ([1c07b5f](https://github.com/superfly/fly/commit/1c07b5f))
* Basic source map support ([#27](https://github.com/superfly/fly/issues/27)) ([1f7301a](https://github.com/superfly/fly/commit/1f7301a))



<a name="0.18.1"></a>
## [0.18.1](https://github.com/superfly/fly/compare/v0.17.1...v0.18.1) (2018-02-25)


### Bug Fixes

* use more generic Context#log to always apply meta data even if called from non-bridged function ([08784a7](https://github.com/superfly/fly/commit/08784a7))



<a name="0.18.0"></a>
# [0.18.0](https://github.com/superfly/fly/compare/v0.17.1...v0.18.0) (2018-02-25)

### Bug Fixes

* remove lingering console.logs from v8env

### Features

* Adds logging transports via `fly.log.addTransport(name: string, options: any)`
* Adds logging metadata if last argument is an object or as persistent meta data with `fly.log.addMetadata(metadata: any)`
* Adds `fly logs` command line to stream logs from production


<a name="0.17.0"></a>
# [0.17.0](https://github.com/superfly/fly/compare/v0.17.0-4...v0.17.0) (2018-02-23)


### Bug Fixes

* **store:** inject secrets into config during config file reload ([#21](https://github.com/superfly/fly/issues/21)) ([649c9bb](https://github.com/superfly/fly/commit/649c9bb))
* **store:** only pull config from `config:` namespace in .fly.yml ([#20](https://github.com/superfly/fly/issues/20)) ([3d6e645](https://github.com/superfly/fly/commit/3d6e645))
* gracefully handle out of band errors ([bb17cdd](https://github.com/superfly/fly/commit/bb17cdd))

### Features

* ProxyStreams ([#15](https://github.com/superfly/fly/issues/15)) ([871fec7](https://github.com/superfly/fly/commit/871fec7))



<a name="0.16.6"></a>
## [0.16.6](https://github.com/superfly/fly/compare/v0.16.5...v0.16.6) (2018-02-14)


### Bug Fixes

* actually use the config object, not the whole object when preparing the deploy config ([e08bf01](https://github.com/superfly/fly/commit/e08bf01))



<a name="0.16.5"></a>
## [0.16.5](https://github.com/superfly/fly/compare/v0.16.4...v0.16.5) (2018-02-14)


### Bug Fixes

* **cli:** display errors for CLI commands and subcommands ([#13](https://github.com/superfly/fly/issues/13)) ([777f713](https://github.com/superfly/fly/commit/777f713))



<a name="0.16.4"></a>
## [0.16.4](https://github.com/superfly/fly/compare/v0.16.3...v0.16.4) (2018-02-14)



<a name="0.16.3"></a>
## [0.16.3](https://github.com/superfly/fly/compare/v0.16.1...v0.16.3) (2018-02-14)


### Bug Fixes

* Commands now take into account environment for figuring out app id ([e1dea00](https://github.com/superfly/fly/commit/e1dea00))



<a name="0.16.2"></a>
## [0.16.2](https://github.com/superfly/fly/compare/v0.16.1...v0.16.2) (2018-02-13)



<a name="0.16.1"></a>
## [0.16.1](https://github.com/superfly/fly/compare/v0.16.0...v0.16.1) (2018-02-09)


### Bug Fixes

* added a few mechanisms is v8env fails ([3fbea22](https://github.com/superfly/fly/commit/3fbea22))



<a name="0.16.0"></a>
# [0.16.0](https://github.com/superfly/fly/compare/v0.15.2...v0.16.0) (2018-02-09)


### Features

* adds cache.put, simplify web api cache, simplify array buffer passing ([31b850e](https://github.com/superfly/fly/commit/31b850e))



<a name="0.15.2"></a>
## [0.15.2](https://github.com/superfly/fly/compare/v0.15.1...v0.15.2) (2018-02-08)



<a name="0.15.1"></a>
## [0.15.1](https://github.com/superfly/fly/compare/v0.15.0-1...v0.15.1) (2018-02-08)


### Bug Fixes

* actually transfer ArrayBuffers directly ([430cc9c](https://github.com/superfly/fly/commit/430cc9c))


### Features

* adds Request and Response clone() ([c0f17db](https://github.com/superfly/fly/commit/c0f17db))



<a name="0.15.0-2"></a>
# [0.15.0-2](https://github.com/superfly/fly/compare/v0.15.0-1...v0.15.0-2) (2018-02-07)



<a name="0.15.0-1"></a>
# [0.15.0-1](https://github.com/superfly/fly/compare/v0.15.0-0...v0.15.0-1) (2018-02-07)


### Bug Fixes

* tests did not include proper context meta data ([1e03fda](https://github.com/superfly/fly/commit/1e03fda))



<a name="0.15.0-0"></a>
# [0.15.0-0](https://github.com/superfly/fly/compare/v0.14.4...v0.15.0-0) (2018-02-07)


### Features

* faster ArrayBuffers between v8 and node with the new isolated-vm's transfer option ([7d8a062](https://github.com/superfly/fly/commit/7d8a062))



<a name="0.14.4"></a>
## [0.14.4](https://github.com/superfly/fly/compare/v0.14.3...v0.14.4) (2018-02-06)



<a name="0.14.3"></a>
## [0.14.3](https://github.com/superfly/fly/compare/v0.14.2...v0.14.3) (2018-02-06)



<a name="0.14.2"></a>
## [0.14.2](https://github.com/superfly/fly/compare/v0.14.1...v0.14.2) (2018-02-05)


### Bug Fixes

* Better trace names for later lookup ([49d15e0](https://github.com/superfly/fly/commit/49d15e0))



<a name="0.14.1"></a>
## [0.14.1](https://github.com/superfly/fly/compare/v0.14.0...v0.14.1) (2018-02-05)



<a name="0.14.0"></a>
# [0.14.0](https://github.com/superfly/fly/compare/v0.13.1...v0.14.0) (2018-02-04)


### Features

* `fly.http`  routing ([b532ded](https://github.com/superfly/fly/commit/b532ded))



<a name="0.13.1"></a>
## [0.13.1](https://github.com/superfly/fly/compare/v0.13.0...v0.13.1) (2018-02-04)


### Bug Fixes

* ws in dependencies, reuse context ([dd1ce44](https://github.com/superfly/fly/commit/dd1ce44))



<a name="0.13.0"></a>
# [0.13.0](https://github.com/superfly/fly/compare/v0.12.0...v0.13.0) (2018-02-03)


### Features

* uglify when deploying ([4d94819](https://github.com/superfly/fly/commit/4d94819))



<a name="0.12.0"></a>
# [0.12.0](https://github.com/superfly/fly/compare/v0.10.2...v0.12.0) (2018-02-03)


### Bug Fixes

* hanging CLI, adds bootstrap warmup ([32bf527](https://github.com/superfly/fly/commit/32bf527))


### Features

* allow v8 inspector on server via --inspect ([f054e88](https://github.com/superfly/fly/commit/f054e88))



<a name="0.11.0"></a>
# [0.11.0](https://github.com/superfly/fly/compare/v0.10.2...v0.11.0) (2018-02-03)


### Features

* allow v8 inspector on server via --inspect ([f054e88](https://github.com/superfly/fly/commit/f054e88))



<a name="0.10.2"></a>
## [0.10.2](https://github.com/superfly/fly/compare/v0.10.1...v0.10.2) (2018-02-02)


### Bug Fixes

* check for null before trying to access a property ([aadd141](https://github.com/superfly/fly/commit/aadd141))



<a name="0.10.1"></a>
## [0.10.1](https://github.com/superfly/fly/compare/v0.10.0...v0.10.1) (2018-02-02)


### Bug Fixes

* secrets are now applied correctly ([8efa441](https://github.com/superfly/fly/commit/8efa441))



<a name="0.10.0"></a>
# [0.10.0](https://github.com/superfly/fly/compare/v0.9.3...v0.10.0) (2018-02-01)


### Features

* new app id format: org/app ([7958437](https://github.com/superfly/fly/commit/7958437))



<a name="0.9.3"></a>
## [0.9.3](https://github.com/superfly/fly/compare/v0.9.2...v0.9.3) (2018-02-01)


### Bug Fixes

* don't API abstraction for logging in, don't have token yet ([5f7dce5](https://github.com/superfly/fly/commit/5f7dce5))



<a name="0.9.2"></a>
## [0.9.2](https://github.com/superfly/fly/compare/v0.9.1...v0.9.2) (2018-02-01)


### Bug Fixes

* some of the CLI commands and API endpoints were slightly off ([f079cd1](https://github.com/superfly/fly/commit/f079cd1))



<a name="0.9.1"></a>
## [0.9.1](https://github.com/superfly/fly/compare/v0.9.0...v0.9.1) (2018-02-01)



<a name="0.9.0"></a>
# [0.9.0](https://github.com/superfly/fly/compare/v0.8.1...v0.9.0) (2018-01-31)


### Features

* use new .fly.yml structure, 'settings' begone, 'config' replaces it. multiple environments can be configured, more details to come ([9e70d1e](https://github.com/superfly/fly/commit/9e70d1e))



<a name="0.8.1"></a>
## [0.8.1](https://github.com/superfly/fly/compare/v0.8.0...v0.8.1) (2018-01-31)


### Bug Fixes

* binary did not work, because symlinked ([a601212](https://github.com/superfly/fly/commit/a601212))



<a name="0.8.0"></a>
# [0.8.0](https://github.com/superfly/fly/compare/v0.8.0-0...v0.8.0) (2018-01-31)



<a name="0.8.0-0"></a>
# [0.8.0-0](https://github.com/superfly/fly/compare/v0.7.1...v0.8.0-0) (2018-01-31)


### Features

* Many new CLI commands and sub commands, major refactor too ([2259a0f](https://github.com/superfly/fly/commit/2259a0f))



<a name="0.7.1"></a>
## [0.7.1](https://github.com/superfly/fly/compare/v0.7.0...v0.7.1) (2018-01-31)



<a name="0.7.0"></a>
# [0.7.0](https://github.com/superfly/fly/compare/v0.6.2...v0.7.0) (2018-01-30)


### Features

* trace timing for each request ([ccee2f2](https://github.com/superfly/fly/commit/ccee2f2))



<a name="0.6.2"></a>
## [0.6.2](https://github.com/superfly/fly/compare/v0.6.1...v0.6.2) (2018-01-30)


### Bug Fixes

* more robust stream reading for bodies ([3aadccb](https://github.com/superfly/fly/commit/3aadccb))



<a name="0.6.1"></a>
## [0.6.1](https://github.com/superfly/fly/compare/v0.6.0...v0.6.1) (2018-01-30)


### Bug Fixes

* priority matching on fly-routes ([c7d348d](https://github.com/superfly/fly/commit/c7d348d))



<a name="0.6.0"></a>
# [0.6.0](https://github.com/superfly/fly/compare/v0.5.9-0...v0.6.0) (2018-01-28)


### Features

* the most basic of basic ssl forwarders ([4435b7a](https://github.com/superfly/fly/commit/4435b7a))



<a name="0.5.9-0"></a>
## [0.5.9-0](https://github.com/superfly/fly/compare/v0.5.8...v0.5.9-0) (2018-01-27)


### Bug Fixes

* found another instance where context needs to be put back ([32392f9](https://github.com/superfly/fly/commit/32392f9))



<a name="0.5.8"></a>
## [0.5.8](https://github.com/superfly/fly/compare/v0.5.7...v0.5.8) (2018-01-26)



<a name="0.5.7"></a>
## [0.5.7](https://github.com/superfly/fly/compare/v0.5.6...v0.5.7) (2018-01-26)



<a name="0.5.6"></a>
## [0.5.6](https://github.com/superfly/fly/compare/v0.5.5...v0.5.6) (2018-01-26)


### Bug Fixes

* prevent duplicate fetch callbacks, release resource on fetch error ([f999eb3](https://github.com/superfly/fly/commit/f999eb3))



<a name="0.5.5"></a>
## [0.5.5](https://github.com/superfly/fly/compare/v0.5.4...v0.5.5) (2018-01-25)


### Bug Fixes

* Disallows returning a Promise from the event handler function ([296c06e](https://github.com/superfly/fly/commit/296c06e))



<a name="0.5.4"></a>
## [0.5.4](https://github.com/superfly/fly/compare/v0.5.3...v0.5.4) (2018-01-25)


### Bug Fixes

* Disallow responding with anything other than a response or something resolving to a response ([1c77f58](https://github.com/superfly/fly/commit/1c77f58))



<a name="0.5.3"></a>
## [0.5.3](https://github.com/superfly/fly/compare/v0.5.2...v0.5.3) (2018-01-25)


### Bug Fixes

* bomb when `FetchEvent.prototype.respondWith` isn't called ([032c2ee](https://github.com/superfly/fly/commit/032c2ee))



<a name="0.5.2"></a>
## [0.5.2](https://github.com/superfly/fly/compare/v0.5.1...v0.5.2) (2018-01-25)


### Bug Fixes

* allow using an async function in `FetchEvent.prototype.respondWith`, closer to spec, but not quite there ([73c0d00](https://github.com/superfly/fly/commit/73c0d00))



<a name="0.5.1"></a>
## [0.5.1](https://github.com/superfly/fly/compare/v0.5.0...v0.5.1) (2018-01-25)


### Bug Fixes

* export more types ([d5c873b](https://github.com/superfly/fly/commit/d5c873b))
* merge Context.meta instead of overriding ([da22a86](https://github.com/superfly/fly/commit/da22a86))



<a name="0.5.0"></a>
# [0.5.0](https://github.com/superfly/fly/compare/v0.4.4...v0.5.0) (2018-01-25)


### Bug Fixes

* pass querystring through to native fetch (fixes [#4](https://github.com/superfly/fly/issues/4)) ([d277d83](https://github.com/superfly/fly/commit/d277d83))
* rule priority order ([db5dffa](https://github.com/superfly/fly/commit/db5dffa))
* rules match hostname properly (fixes [#3](https://github.com/superfly/fly/issues/3)) ([9ff560f](https://github.com/superfly/fly/commit/9ff560f))


### Features

* Create ContextStore interface, use a DefaultContextStore (removes isolate pool) ([0938252](https://github.com/superfly/fly/commit/0938252))



<a name="0.4.5"></a>
## [0.4.5](https://github.com/superfly/fly/compare/v0.4.4...v0.4.5) (2018-01-25)


### Bug Fixes

* Handle deploy failures gracefully ([cb3955b](https://github.com/superfly/fly/commit/cb3955b))



<a name="0.4.4"></a>
## [0.4.4](https://github.com/superfly/fly/compare/v0.4.3...v0.4.4) (2018-01-24)


### Bug Fixes

* removes any references to synchronous isolated-vm functions, use async one ([5515f22](https://github.com/superfly/fly/commit/5515f22))
* test isolate before accepting into default pool ([97379ad](https://github.com/superfly/fly/commit/97379ad))



<a name="0.4.3"></a>
## [0.4.3](https://github.com/superfly/fly/compare/v0.4.2...v0.4.3) (2018-01-24)



<a name="0.4.2"></a>
## [0.4.2](https://github.com/superfly/fly/compare/v0.4.1...v0.4.2) (2018-01-23)


### Bug Fixes

* use internal logger so as to not conflict with console.* ([165ead0](https://github.com/superfly/fly/commit/165ead0))



<a name="0.4.1"></a>
## [0.4.1](https://github.com/superfly/fly/compare/v0.4.0...v0.4.1) (2018-01-22)



<a name="0.4.0"></a>
# [0.4.0](https://github.com/superfly/fly/compare/v0.3.1...v0.4.0) (2018-01-22)


### Features

* Adds 'log' event, dispatched with a LogEvent containing a Log with a level, message and timestamp ([8ac6668](https://github.com/superfly/fly/commit/8ac6668))



<a name="0.3.1"></a>
## [0.3.1](https://github.com/superfly/fly/compare/v0.3.0...v0.3.1) (2018-01-22)



<a name="0.3.0"></a>
# [0.3.0](https://github.com/superfly/fly/compare/v0.2.9...v0.3.0) (2018-01-22)


### Features

* Adds onRequest server option to handle custom routes ([a92601b](https://github.com/superfly/fly/commit/a92601b))



<a name="0.2.9"></a>
## [0.2.9](https://github.com/superfly/fly/compare/v0.2.8...v0.2.9) (2018-01-21)



<a name="0.2.8"></a>
## [0.2.8](https://github.com/superfly/fly/compare/v0.2.7...v0.2.8) (2018-01-18)



<a name="0.2.7"></a>
## [0.2.7](https://github.com/superfly/fly/compare/v0.2.6...v0.2.7) (2018-01-18)



<a name="0.2.6"></a>
## [0.2.6](https://github.com/superfly/fly/compare/v0.2.4...v0.2.6) (2018-01-18)



<a name="0.2.5"></a>
## [0.2.5](https://github.com/superfly/fly/compare/v0.2.4...v0.2.5) (2018-01-18)



<a name="0.2.4"></a>
## [0.2.4](https://github.com/superfly/fly/compare/v0.2.3...v0.2.4) (2018-01-17)



<a name="0.2.3"></a>
## [0.2.3](https://github.com/superfly/fly/compare/v0.2.1...v0.2.3) (2018-01-17)



<a name="0.2.2"></a>
## [0.2.2](https://github.com/superfly/fly/compare/v0.2.1...v0.2.2) (2018-01-16)



<a name="0.2.1"></a>
## 0.2.1 (2018-01-16)
