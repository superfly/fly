import log from '../log'
import * as winston from 'winston';

import { Config, ivm } from '..';

import { registerBridge } from '.';
import { Context } from '../context';
import { isIP } from 'net';
import { lookup } from 'dns';
const { Syslog } = require('winston-syslog');

let defaultLogger: winston.LoggerInstance;

registerBridge('log', function (ctx: Context, config: Config, lvl: string, msg: string) {
  ctx.logger.log(lvl, msg)
})

enum TransportType {
  Syslog = 'syslog',
}

registerBridge('addLogTransport', async function (
  ctx: Context, config: Config,
  type: TransportType, options: any, cb: ivm.Reference<Function>) {
  ctx.addCallback(cb);

  if (!!ctx.logger.transports[type])
    return ctx.applyCallback(cb, [null, false]);

  log.debug("Adding transport", type)

  try {
    switch (type) {
      case TransportType.Syslog:
        const ip = await resolveHostname(options.host)
        ctx.logger.add(Syslog, Object.assign(options, {
          app_name: ctx.meta.app && ctx.meta.app.id || "app",
          host: ip,
          protocol: 'udp4'
        }));
        break;

      default:
        ctx.tryCallback(cb, ['Unsupported log transport type: ' + type]);
        break;
    }
  } catch (err) {
    ctx.tryCallback(cb, [err.toString()])
    return
  }
  ctx.applyCallback(cb, [null, true]);
});

const localIPRegexp = /(^127\.)|(^192\.168\.)|(^10\.)|(^172\.1[6-9]\.)|(^172\.2[0-9]\.)|(^172\.3[0-1]\.)|(^::1$)|(^[fF][cCdD])/

async function resolveHostname(hostname: string) {
  let ip: string;
  if (isIP(hostname))
    ip = hostname
  else
    ip = await new Promise<string>((resolve, reject) => lookup(hostname, (err, address) => err ? reject(err) : resolve(address)))

  if (localIPRegexp.test(ip))
    if (process.env.NODE_ENV === 'production')
      throw new Error("resolved ip is local")
    else
      log.warn("You specified a host resolving to a local IP, this will silently fail when deployed in production")

  return ip
}