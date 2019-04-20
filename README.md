![superfly octokitty](https://user-images.githubusercontent.com/7375749/44759033-57b92780-aafd-11e8-880c-818b01c65ff3.png)


# Fly

[![npm version](https://img.shields.io/npm/v/@fly/fly.svg)](https://www.npmjs.com/package/@fly/fly)
[![isc license](https://img.shields.io/npm/l/@fly/fly.svg)](https://github.com/superfly/fly/blob/master/LICENSE) 
[![Build Status](https://dev.azure.com/flydotio/fly/_apis/build/status/fly)](https://dev.azure.com/flydotio/fly/_build/latest?definitionId=1)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org) 
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fsuperfly%2Ffly.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fsuperfly%2Ffly?ref=badge_shield)
![Gitter](https://img.shields.io/gitter/room/superfly/fly.svg?colorB=red)

The Fly runtime is an open source Javascript environment built to run Edge Applications. It gives developers powerful caching, content modification, and routing tools.

The runtime is based on v8, with a proxy-appropriate set of Javascript libraries. There are built in APIs for manipulating HTML and Image content, low level caching, and HTTP requests/responses. When possible, we use WhatWG standards (like `fetch`, `Request`, `Response`, `Cache`, `ReadableStream`).

You can [use it locally](#hello-world) for development and testing, and [deploy it to Fly's fleet](#deployment) of edge servers for production use.

## Edge Applications: the in between

You can use Fly to build HTTP load balancers, caching services, etc, etc. Edge Applications are typically built to replace or augment infrastructure that runs between web apps and users.

![edge ascci](https://fly.io/articles/content/images/2018/08/edge-ascii@2x.png)

This in-between is a great place to solve certain categories of problems. If you need to solve one of these, you might want to build an Edge Application:

* A/B testing at the load balancer layer
* Route traffic to different cloud providers
* Cache personalization data geographically close to individual users
* Route authenticated users to specific apps
* Enforce backend SLAs, serve fallback content when backends are degraded
* Load balancers across cloud storage providers
* Per user rate limiting (for APIs or apps)

## Installation

#### macOS

Homebrew is the quickest way to get started on macOS:

```bash
brew tap superfly/brew && brew install superfly/brew/fly
```

#### Linux

Use the [standalone installer](#standalone-install)

#### Windows

Use [npm](#npm)

### Other installation methods

#### Standalone Install

The standalone install is a tarball containing the Fly CLI, precompiled native extensions, and a nodejs binary. This is useful in containers or hosts with restricted access.

To quickly install into `/usr/local/lib/fly` and `/usr/local/bin/fly`, run this [script](https://github.com/superfly/fly/blob/master/install-standalone.sh) (requires sudo and not Windows compatible):

```bash
curl https://get.fly.io/install.sh | sh
```

Otherwise, download one of the tarballs below and extract it yourself.

#### Tarballs

* [macOS](https://get.fly.io/tarballs/stable/fly-darwin-x64.tar.gz)
* [Linux (x64)](https://get.fly.io/tarballs/stable/fly-linux-x64.tar.gz)

#### npm

The Fly CLI and runtime is built on Node.js with native extensions. As a result, installing from npm requires a proper C/C++ compiler toolchain and takes significantly longer than the other methods. If you're on Windows or don't have XCode/gcc installed, follow the [node-gyp instructions](https://github.com/nodejs/node-gyp#installation) before continuing.

Install globally:

```bash
npm install -g @fly/fly
```

or as a devDependency in your project:

```bash
npm install --save-dev @fly/fly
```

## Usage

### Hello World!

Write javascript code to a file (`index.js`):

```js
fly.http.respondWith((request) => {
  return new Response("Hello! We support whirled peas.", { status: 200})
})
// if you'd prefer to be service worker compatibility, this is also supported:
// around addEventListener('fetch', function(event){})
```

Start the fly server:

```bash
fly server
```

Visit your app:

```bash
open http://localhost:3000
```

Change code and configuration, it's reloaded seamlessly.

### How does it work?

Simply put:

- Uses a basic webpack configuration to bundle your javascript
- Assumes the presence of `index.js` or `index.ts`
- You can customize everything by creating a `webpack.fly.config.js` which will be loaded for you
- Use npm packages compatible with the v8 javascript engine, you don't have access to node.js-specific concepts or packages.

### Configuration

By default, fly will read your `.fly.yml` file in your current working directory.

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

When deployed on fly.io, secrets are fetched from an encrypted store. You need to pre-define your secrets via `fly secrets:set <key> <value>`.

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

Make sure you've created your fly app for your account with `fly apps:create [name]` (name is optional)

Set your `app` property in your `.fly.yml`

### 3. Deploy!

Using `fly deploy`, here's what happens:
- Your code is bundled via webpack, it's also uglified to save space
- Your code, source map and `files` are added to a simple tarball, gzipped and uploaded to the fly.io API using your token
- We create a "release" for your app, those are immutable, changing anything (by using `fly deploy` or `fly secrets:set`) will trigger a new release which will be deployed automatically
- Your code is distributed instantly(-ish) across our global fleet of servers

## Logs

Tail production logs with:

```bash
fly logs
```

## Documentation

- [Getting Started](https://fly.io/docs/apps/)
- [API Reference](https://fly.io/docs/apps/api/index.html)
- [Examples](https://github.com/superfly/edge/)

## Open source

We develop fly in the open. We're [Apache licensed](https://github.com/superfly/fly/blob/master/LICENSE) and designed to run easily in local dev. You _can_ deploy our core software to production, but it takes a little elbow grease and a fair amount of infrastructure. If you want to give this a try, let us know and we can help (and we would love related pull requests!).

Our commercial offering is built on top of this library, with additional code for managing certificates, distributed caching, and multi-tenant isolation. Over time we expect to extract many of these features, document them, and include them in our open source releases.

We support [Let's Encrypt](https://github.com/letsencrypt): We donate half our certificate management fees to Let's Encrypt every year.

[![](https://img.shields.io/twitter/url/http/shields.io.svg?style=social)](https://twitter.com/flydotio)
