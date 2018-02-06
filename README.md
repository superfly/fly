# Fly

[![Build Status](https://travis-ci.org/superfly/fly.svg?branch=master)](https://travis-ci.org/superfly/fly) [![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

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
// index.js

addEventListener("fetch", function(event) {
  const res = new Response("Hello! We support whirled peas.", { status: 200 })
  event.respondWith(res)
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
app_id: my-app-id
config:
  foo: bar
```

#### App configuration

Located in your `.fly.yml` file.

- `app_id` - the fly.io app id, can be ommitted, useful for deployment purposes
- `config` - arbitrary settings for your applications, accessible in your code via the global variable `app.config`

#### Server configuration

Using environment variables:

- `port` (`FLY_PORT` or `PORT`) - is either a number or a string, it can refer to unix socket (default: `3000`)
- `log_level` (`FLY_LOG_LEVEL` or `LOG_LEVEL`) - is how much logs we'll show you, can be `info`, `debug`, `warn`, `error` (default: `debug` in development, `info` everywhere else)
- `env` (`FLY_ENV` or `NODE_ENV`) - current deployment environment: `development`, `test` or `production` (default: `development`)