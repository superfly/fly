# Fly `cli`

<!-- commands -->
* [`fly apps`](#fly-apps)
* [`fly apps:create APP-NAME`](#fly-appscreate-app-name)
* [`fly apps:delete`](#fly-appsdelete)
* [`fly apps:move`](#fly-appsmove)
* [`fly build [PATH]`](#fly-build-path)
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

OPTIONS
  --token=token  The api token to use. This will override the token created with `fly login` if present.
```

_See code: [lib/commands/apps/index.js](https://github.com/superfly/fly/blob/v0.54.0-pre.1/lib/commands/apps/index.js)_

## `fly apps:create APP-NAME`

create a new app

```
USAGE
  $ fly apps:create APP-NAME

ARGUMENTS
  APP-NAME  Unique name for the new app. Allowed characters are [a-z0-9-_.], will be lowercased

OPTIONS
  --token=token  The api token to use. This will override the token created with `fly login` if present.
```

_See code: [lib/commands/apps/create.js](https://github.com/superfly/fly/blob/v0.54.0-pre.1/lib/commands/apps/create.js)_

## `fly apps:delete`

delete an app

```
USAGE
  $ fly apps:delete

OPTIONS
  -a, --app=app  The app to run commands against
  --env=env      [default: production] environment to use for commands
  --token=token  The api token to use. This will override the token created with `fly login` if present.
```

_See code: [lib/commands/apps/delete.js](https://github.com/superfly/fly/blob/v0.54.0-pre.1/lib/commands/apps/delete.js)_

## `fly apps:move`

move an new app to another organization

```
USAGE
  $ fly apps:move

OPTIONS
  -a, --app=app  The app to run commands against
  --env=env      [default: production] environment to use for commands
  --token=token  The api token to use. This will override the token created with `fly login` if present.
```

_See code: [lib/commands/apps/move.js](https://github.com/superfly/fly/blob/v0.54.0-pre.1/lib/commands/apps/move.js)_

## `fly build [PATH]`

Build your local Fly app

```
USAGE
  $ fly build [PATH]

ARGUMENTS
  PATH  [default: .] path to app

OPTIONS
  -a, --app=app        The app to run commands against
  -o, --output=output  (required) [default: .fly/release.tar.gz] Path to output file
  --env=env            [default: production] environment to use for commands
```

_See code: [lib/commands/build.js](https://github.com/superfly/fly/blob/v0.54.0-pre.1/lib/commands/build.js)_

## `fly deploy [PATH]`

Deploy your local Fly app

```
USAGE
  $ fly deploy [PATH]

ARGUMENTS
  PATH  [default: /Users/md/src/superfly/fly/packages/cli] path to app

OPTIONS
  -a, --app=app  The app to run commands against
  --env=env      [default: production] environment to use for commands
  --token=token  The api token to use. This will override the token created with `fly login` if present.
```

_See code: [lib/commands/deploy.js](https://github.com/superfly/fly/blob/v0.54.0-pre.1/lib/commands/deploy.js)_

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
  -a, --app=app  The app to run commands against
  --env=env      [default: production] environment to use for commands
  --token=token  The api token to use. This will override the token created with `fly login` if present.
```

_See code: [lib/commands/hostnames/index.js](https://github.com/superfly/fly/blob/v0.54.0-pre.1/lib/commands/hostnames/index.js)_

## `fly hostnames:add HOSTNAME`

add hostnames to an app

```
USAGE
  $ fly hostnames:add HOSTNAME

ARGUMENTS
  HOSTNAME  hostname to add

OPTIONS
  -a, --app=app  The app to run commands against
  --env=env      [default: production] environment to use for commands
  --token=token  The api token to use. This will override the token created with `fly login` if present.
```

_See code: [lib/commands/hostnames/add.js](https://github.com/superfly/fly/blob/v0.54.0-pre.1/lib/commands/hostnames/add.js)_

## `fly login`

login to fly

```
USAGE
  $ fly login
```

_See code: [lib/commands/login.js](https://github.com/superfly/fly/blob/v0.54.0-pre.1/lib/commands/login.js)_

## `fly logs`

logs for an app

```
USAGE
  $ fly logs

OPTIONS
  -a, --app=app  The app to run commands against
  --env=env      [default: development] environment to use for commands
  --token=token  The api token to use. This will override the token created with `fly login` if present.
```

_See code: [lib/commands/logs.js](https://github.com/superfly/fly/blob/v0.54.0-pre.1/lib/commands/logs.js)_

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

_See code: [lib/commands/new.js](https://github.com/superfly/fly/blob/v0.54.0-pre.1/lib/commands/new.js)_

## `fly orgs`

list your organizations

```
USAGE
  $ fly orgs

OPTIONS
  --token=token  The api token to use. This will override the token created with `fly login` if present.
```

_See code: [lib/commands/orgs.js](https://github.com/superfly/fly/blob/v0.54.0-pre.1/lib/commands/orgs.js)_

## `fly releases`

list releases for an app

```
USAGE
  $ fly releases

OPTIONS
  -a, --app=app  The app to run commands against
  --env=env      [default: development] environment to use for commands
  --token=token  The api token to use. This will override the token created with `fly login` if present.
```

_See code: [lib/commands/releases.js](https://github.com/superfly/fly/blob/v0.54.0-pre.1/lib/commands/releases.js)_

## `fly secrets`

manage app secrets

```
USAGE
  $ fly secrets
```

_See code: [lib/commands/secrets/index.js](https://github.com/superfly/fly/blob/v0.54.0-pre.1/lib/commands/secrets/index.js)_

## `fly secrets:set KEY [VALUE]`

add secrets to an app

```
USAGE
  $ fly secrets:set KEY [VALUE]

ARGUMENTS
  KEY    name of the secret
  VALUE  value of the secret

OPTIONS
  -a, --app=app          The app to run commands against
  --env=env              [default: development] environment to use for commands
  --from-file=from-file  use a file's contents as the secret value
  --token=token          The api token to use. This will override the token created with `fly login` if present.
```

_See code: [lib/commands/secrets/set.js](https://github.com/superfly/fly/blob/v0.54.0-pre.1/lib/commands/secrets/set.js)_

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

_See code: [lib/commands/server.js](https://github.com/superfly/fly/blob/v0.54.0-pre.1/lib/commands/server.js)_

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

_See code: [lib/commands/test.js](https://github.com/superfly/fly/blob/v0.54.0-pre.1/lib/commands/test.js)_
<!-- commandsstop -->
