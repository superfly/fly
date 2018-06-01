[![npm version](https://img.shields.io/npm/v/@fly/fly.svg)](https://www.npmjs.com/package/@fly/fly) [![isc license](https://img.shields.io/npm/l/@fly/fly.svg)](https://github.com/superfly/fly/blob/master/LICENSE) [![Build Status](https://travis-ci.org/superfly/fly.svg?branch=master)](https://travis-ci.org/superfly/fly) [![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org) [![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fsuperfly%2Ffly.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fsuperfly%2Ffly?ref=badge_shield)

# Fly

The fly.io Edge Application runtime is an open core Javascript environment built for proxy servers. It gives developers powerful caching, content modification, and routing tools.

The runtime is based on v8, with a proxy-appropriate set of Javascript libraries. There are built in APIs for manipulating HTML and Image content, low level caching, and HTTP requests/responses. When possible, we use WhatWG standards (like `fetch`, `Request`, `Response`, `Cache`, `ReadableStream`).

You can [use it locally](#hello-world) for development and testing, and [deploy it to Fly's fleet](#deployment) of edge servers for production use. 

## Usage

### Installation

Install globally:

```
npm install -g @fly/fly
```

or as a `devDependency` in your project:

```
npm install --save-dev @fly/fly
```

#### Windows Users

Follow the node-gyp instructions from here: [node-gyp](https://github.com/nodejs/node-gyp)


### Hello World!

Write javascript code to a file (`index.js`):

```js
fly.http.respondWith(function(request){
  return new Response("Hello! We support whirled peas.", { status: 200})
})
// if you'd prefer to be service worker compatibility, this is also supported:
// around addEventListener('fetch', function(event){})
```

Start the fly server:

```
fly server
```

Visit your app:

```
open http://localhost:3000
```

Change code and configuration, it's reloaded seamlessly.

### How does it work?

Simply put:

- Uses webpack to bundle your javascript
- Assumes the presence of `index.js` and a basic webpack configuration
- You can customize everything by creating a `webpack.fly.config.js` which will be loaded for you
- Use npm packages compatible with the v8 javascript engine, you don't have access to node.js-specific concepts or packages.

### Configuration

By default, fly will read your a `.fly.yml` file in your current working directory.

```yaml
# .fly.yml
app: my-app-name
config:
  foo: bar
files:
  - path/to/file
```

Properties:

- `app` - the fly.io app name, can be ommitted, useful for deployment purposes
- `config` - arbitrary settings for your applications, accessible in your code via the global variable `app.config`
- `files` - array of files, relative to your `.fly.yml` to include in the deployment. Can be accessed via `fetch("file://path/to/file")`

### Secrets

You can require secrets in your app.config like this:

```yaml
# .fly.yml
app: my-app-name
config:
  secretThing:
    fromSecret: secretKey
```

In your code, you can seamlessly use this value like:

```javascript
app.config.secretThing
```

When deployed on fly.io, secrets are fetched from an encrypted store. You need to pre-define your secrets via `fly secrets set <key> <value>`.

Locally, you need to define them in a `.fly.secrets.yml` file, make sure you add it to your `.gitignore` as it can contain sensitive data. Example file.

```yaml
# .fly.secrets.yml
secretKey: <your secret value>
```

### Files

By specifying a `files` property in your `.fly.yml`, it's possible to use `fetch` to load files without having to bundle them in your javascript directly.

Locally, these are fetched from your filesystem. Deployed, these are fetched from our distributed store.

Example usage in your code: (given a `client/app.js` file)

```javascript
// index.js

addEventListener('fetch', function(event){
  event.respondWith(async function(){
    const res = await fetch("file://client/app.js")
    res.status // 200
    res.headers.set("content-type", "application/javascript")
    return res
  })
})
```

Note that fetching with the `file:` protocol returns a very basic response.

### Multiple environments

Different environments (development, test, production) require different configurations. You can specify how each should behave by adding one level to your `.fly.yml` like:

```yaml
config: &config # your default config
  foo: bar

default: &default
  app: your-app-name
  config:
    <<: *config

development:
  <<: *default

test:
  <<: *default
  config:
    <<: *config
    foo: not-bar

production:
  <<: *default
  config:
    <<: *config
    foo:
      fromSecret: fooSecret
```

## Testing

`fly` comes with `mocha` as its default testing framework.

You can write unit tests and use `fly test` to run them within the fly environment:

```javascript
// ./test/index.spec.js
import { MyModule } from '../my_module' // load some code
import { expect } from 'chai'

describe("MyModule", ()=>{
  it("works", function(){
    expect(MyModule).to.be.instanceof(Function)
  })
})
```

## Deployment

Once you're happy with your app, you can deploy to [fly.io](https://fly.io).

### 1. Login

Use `fly login` to log into your fly.io account, if you don't have one, go create one!

### 2. Create an app

Make sure you've created your fly app for your account with `fly apps create [name]` (name is optional)

Set your `app` property in your `.fly.yml`

### 3. Deploy!

Using `fly deploy`, here's what happens:
- Your code is bundled via webpack, it's also uglified to save space
- Your code, source map and `files` are added to a simple tarball, gzipped and uploaded to the fly.io API using your token
- We create a "release" for your app, those are immutable, changing anything (by using `fly deploy` or `fly secrets set`) will trigger a new release which will be deployed automatically
- Your code is distributed instantly(-ish) across our global fleet of servers


## Open core

We develop fly in the open, the core of our service is [Apache licensed](https://github.com/superfly/fly/blob/master/LICENSE) and designed to run easily in local dev. You _can_ deploy our core software to production, but it takes a little elbow grease and a fair amount of infrastructure. If you want to give this a try, let us know and we can help (and we would love related pull requests).

Our commercial offering is built on top of this library, with additional code for managing certificates, distributed caching, and multi-tenant isolation. Over time we expect to extract many of these features, document them, and include them in our open source releases.
