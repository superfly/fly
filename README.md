[![npm version](https://img.shields.io/npm/v/@fly/fly.svg)](https://www.npmjs.com/package/@fly/fly) [![isc license](https://img.shields.io/npm/l/@fly/fly.svg)](https://github.com/superfly/fly/blob/master/LICENSE) [![Build Status](https://travis-ci.org/superfly/fly.svg?branch=master)](https://travis-ci.org/superfly/fly) [![Coverage Status](https://coveralls.io/repos/github/superfly/fly/badge.svg?branch=master)](https://coveralls.io/github/superfly/fly?branch=master) [![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

# Fly

Basic engine running fly.io edge apps

## Installation

Install globally:

```
npm install -g @fly/fly
```

or as a `devDependency` in your project:

```
npm install --save-dev @fly/fly
```

## Usage

### Hello World!

Write javascript code to a file (`index.js`):

```js
fly.http.respondWith(function(request){
  return new Response("Hello! We support whirled peas.", { status: 200})
})
```

Start the fly server:

```
fly server
```

Visit your app:

```
open http://localhost:3000
```

### Configuration

By default, fly will read your a `.fly.yml` file in your current working directory.

```yaml
app: my-app-name
config:
  foo: bar
```

#### App configuration

Located in your `.fly.yml` file.

- `app` - the fly.io app name, can be ommitted, useful for deployment purposes
- `config` - arbitrary settings for your applications, accessible in your code via the global variable `app.config`

#### Server configuration

Using environment variables:

- `port` (`FLY_PORT` or `PORT`) - is either a number or a string, it can refer to unix socket (default: `3000`)
- `log_level` (`FLY_LOG_LEVEL` or `LOG_LEVEL`) - is how much logs we'll show you, can be `info`, `debug`, `warn`, `error` (default: `debug` in development, `info` everywhere else)
- `env` (`FLY_ENV` or `NODE_ENV`) - current deployment environment: `development`, `test` or `production` (default: `development`)