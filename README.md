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
// index.js

addEventListener("fetch", async (event) => {
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
app:
  id: my-app-id
  settings:
    foo: bar

port: 4000 # defaults to 3000
log_level: debug
env: development
```

#### App configuration

Located in `app` in your `.fly.yml` file.

- `id` - the fly.io app id, can be ommitted, useful for deployment purposes
- `settings` - arbitrary settings for your applications, accessible in your code via the global variable `appSettings`

#### Server configuration

Located at the root level of the `.fly.yml` file.

- `port` - is either a number or a string, it can refer to unix socket (default: `3000`)
- `log_level` - is how much logs we'll show you, can be `info`, `debug`, `warn`, `error` (default: `debug` in development, `info` everywhere else)
- `env` - current deployment environment: `development`, `test` or `production` (default: `development`)

#### Environment overrides

- `port` can be overriden by the environment variables `FLY_PORT` or `PORT` in that order
- `log_level` will also lookup `FLY_LOG_LEVEL` or `LOG_LEVEL`
- `env` will check `FLY_ENV` and then `NODE_ENV`