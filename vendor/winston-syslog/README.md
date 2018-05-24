# winston-syslog

A Syslog transport for [winston][0].

## Installation

### Installing npm (node package manager)

``` bash
  $ curl http://npmjs.org/install.sh | sh
```

### Installing winston-syslog

``` bash
  $ npm install winston 
  $ npm install winston-syslog
```

## Motivation
`tldr;?`: To break the [winston][0] codebase into small modules that work together.

The [winston][0] codebase has been growing significantly with contributions and other logging transports. This is **awesome**. However, taking a ton of additional dependencies just to do something simple like logging to the Console and a File is overkill.  

## Usage
To use the Syslog transport in [winston][0], you simply need to require it and then either add it to an existing [winston][0] logger or pass an instance to a new [winston][0] logger:

``` js
  var winston = require('winston');
  
  //
  // Requiring `winston-syslog` will expose 
  // `winston.transports.Syslog`
  //
  require('winston-syslog').Syslog;
  
  winston.add(winston.transports.Syslog, options);
```

In addition to the options accepted by the syslog (compliant with [RFC 3164][1] and [RFC 5424][2]), the Riak transport also accepts the following options. It is worth noting that the riak-js debug option is set to *false* by default:

* __host:__ The host running syslogd, defaults to localhost.
* __port:__ The port on the host that syslog is running on, defaults to syslogd's default port.
* __protocol:__ The network protocol to log over (e.g. `tcp4`, `udp4`, `unix`, `unix-connect`, etc).
* __path:__ The path to the syslog dgram socket (i.e. `/dev/log` or `/var/run/syslog` for OS X).
* __pid:__ PID of the process that log messages are coming from (Default `process.pid`).
* __facility:__ Syslog facility to use (Default: `local0`).
* __localhost:__ Host to indicate that log messages are coming from (Default: `localhost`).
* __type:__ The type of the syslog protocol to use (Default: `BSD`, also valid: `5424`).
* __app_name:__ The name of the application (Default: `process.title`).
* __eol:__ The end of line character to be added to the end of the message (Default: Message without modifications).

*Metadata:* Logged as string compiled by [glossy][3].

## Log Levels
Because syslog only allows a subset of the levels available in [winston][0], levels that do not match will be ignored. Therefore, in order to use `winston-syslog` effectively, you should indicate to [winston][0] that you want to use the syslog levels:

``` js
  var winston = require('winston');
  winston.setLevels(winston.config.syslog.levels);
```

The `Syslog` transport will only log to the level that are available in the syslog protocol. These are (in increasing order of severity):

* debug
* info
* notice
* warning
* error
* crit
* alert
* emerg

## Syslog Configuration

You will have to configure your syslog server to accept TCP connections.
This is usually done in `/etc/syslog-ng.conf`. Let's say you have an app called `fnord`,
the configuration would look something like this:

```
  source tcp_s {
    tcp(ip(0.0.0.0) port(514) max-connections(256));
  };
  destination fnord_d {
    file("/var/log/fnord.log");
  };
  log { source(tcp_s); destination(fnord_d); };
```

If you have multiple apps which need to log via TCP, you can specify filters, as such:

```
  filter fnord_f { program("fnord"); };
```

Then modify the log statement to read:

```
  log { source(tcp_s); filter(fnord_f); destination(fnord_d); };
```

Now if you have another app, called `bnord`, create similar `destination` and `filter` configurations for it, and specify a new log statement, with the same `source`:

```
  log { source(tcp_s); filter(bnord_f); destination(bnord_d); };
```

For this to work, you have to make sure you set the `process.title` variable in your node app.

``` js
  process.title = 'fnord';
```

#### Author: [Charlie Robbins](http://blog.nodejitsu.com)
#### Contributors: [Squeeks](https://github.com/squeeks)

[0]: https://github.com/indexzero/winston
[1]: http://www.ietf.org/rfc/rfc3164.txt
[2]: http://tools.ietf.org/html/rfc5424
[3]: https://github.com/squeeks/glossy
