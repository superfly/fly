# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
