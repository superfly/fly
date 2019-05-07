# Fly `cli`

<!-- commands -->
* [`fly apps`](#fly-apps)
* [`fly apps:create APP-NAME`](#fly-appscreate-app-name)
* [`fly apps:delete`](#fly-appsdelete)
* [`fly apps:move`](#fly-appsmove)
* [`fly build [PATH] [OUTFILE]`](#fly-build-path-outfile)
* [`fly deploy [PATH]`](#fly-deploy-path)
* [`fly help [COMMAND]`](#fly-help-command)
* [`fly hostnames`](#fly-hostnames)
* [`fly hostnames:add HOSTNAME`](#fly-hostnamesadd-hostname)
* [`fly login`](#fly-login)
* [`fly logs`](#fly-logs)
* [`fly new NAME`](#fly-new-name)
* [`fly orgs`](#fly-orgs)
* [`fly releases`](#fly-releases)
* [`fly secrets`](#fly-secrets)
* [`fly secrets:set KEY [VALUE]`](#fly-secretsset-key-value)
* [`fly server [PATH]`](#fly-server-path)
* [`fly test [PATTERN]`](#fly-test-pattern)

## `fly apps`

list your apps

```
USAGE
  $ fly apps
```

## `fly apps:create APP-NAME`

create a new app

```
USAGE
  $ fly apps:create APP-NAME

ARGUMENTS
  APP-NAME  Unique name for the new app. Allowed characters are [a-z0-9-_.], will be lowercased
```

## `fly apps:delete`

delete an app

```
USAGE
  $ fly apps:delete

OPTIONS
  -a, --app=app  the app to run commands against
  --env=env      [default: development] environment to use for commands
```

## `fly apps:move`

move an new app to another organization

```
USAGE
  $ fly apps:move

OPTIONS
  -a, --app=app  the app to run commands against
  --env=env      [default: development] environment to use for commands
```

## `fly build [PATH] [OUTFILE]`

Build your local Fly app

```
USAGE
  $ fly build [PATH] [OUTFILE]

ARGUMENTS
  PATH     [default: /Users/md/src/superfly/fly/packages/cli] path to app
  OUTFILE  [default: .fly/release.tar.gz] path to output file

OPTIONS
  -a, --app=app  the app to run commands against
  --env=env      [default: production] environment to use for commands
```

_See code: [lib/commands/build.js](https://github.com/superfly/fly/blob/v0.53.0-pre.0/lib/commands/build.js)_

## `fly deploy [PATH]`

Deploy your local Fly app

```
USAGE
  $ fly deploy [PATH]

ARGUMENTS
  PATH  [default: /Users/md/src/superfly/fly/packages/cli] path to app

OPTIONS
  -a, --app=app  the app to run commands against
  --env=env      [default: production] environment to use for commands
```

_See code: [lib/commands/deploy.js](https://github.com/superfly/fly/blob/v0.53.0-pre.0/lib/commands/deploy.js)_

## `fly help [COMMAND]`

display help for fly

```
USAGE
  $ fly help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.1.6/src/commands/help.ts)_

## `fly hostnames`

list hostnames for an app

```
USAGE
  $ fly hostnames

OPTIONS
  -a, --app=app  the app to run commands against
  --env=env      [default: development] environment to use for commands
```

## `fly hostnames:add HOSTNAME`

add hostnames to an app

```
USAGE
  $ fly hostnames:add HOSTNAME

ARGUMENTS
  HOSTNAME  hostname to add

OPTIONS
  -a, --app=app  the app to run commands against
  --env=env      [default: development] environment to use for commands
```

## `fly login`

login to fly

```
USAGE
  $ fly login
```

## `fly logs`

logs for an app

```
USAGE
  $ fly logs

OPTIONS
  -a, --app=app  the app to run commands against
  --env=env      [default: development] environment to use for commands
```

## `fly new NAME`

create a new app

```
USAGE
  $ fly new NAME

ARGUMENTS
  NAME  app-name

OPTIONS
  -t, --template=template  the template to use
```

## `fly orgs`

list your organizations

```
USAGE
  $ fly orgs
```

## `fly releases`

list releases for an app

```
USAGE
  $ fly releases

OPTIONS
  -a, --app=app  the app to run commands against
  --env=env      [default: development] environment to use for commands
```

## `fly secrets`

manage app secrets

```
USAGE
  $ fly secrets
```

## `fly secrets:set KEY [VALUE]`

add secrets to an app

```
USAGE
  $ fly secrets:set KEY [VALUE]

ARGUMENTS
  KEY    name of the secret
  VALUE  value of the secret

OPTIONS
  -a, --app=app          the app to run commands against
  --env=env              [default: development] environment to use for commands
  --from-file=from-file  use a file's contents as the secret value
```

## `fly server [PATH]`

run the local fly development server

```
USAGE
  $ fly server [PATH]

ARGUMENTS
  PATH  [default: /Users/md/src/superfly/fly/packages/cli] path to app

OPTIONS
  -p, --port=port  [default: 3000] Port to bind to
  --env=env        [default: development] environment to use for commands
  --inspect        use the v8 inspector on your fly app
  --uglify         uglify your code like we'll use in production (warning: slow!)
  --[no-]watch     reload when source or configs change
```

_See code: [lib/commands/server.js](https://github.com/superfly/fly/blob/v0.53.0-pre.0/lib/commands/server.js)_

## `fly test [PATTERN]`

run unit tests

```
USAGE
  $ fly test [PATTERN]

ARGUMENTS
  PATTERN  [default: {test,spec,tests,specs}/**/*.{test,spec}.{js,ts}] test file path pattern

EXAMPLES
  fly test test/**
  fly test __test__/test_file.ts
  fly test test/test_a.ts test/test_b.ts
  fly test test/these/** !but_not_this.js
```

_See code: [lib/commands/test.js](https://github.com/superfly/fly/blob/v0.53.0-pre.0/lib/commands/test.js)_
<!-- commandsstop -->
