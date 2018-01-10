import { conf } from './config'
import * as winston from 'winston';

export default new winston.Logger({
  level: conf.logLevel,
  transports: [
    new winston.transports.Console({ timestamp: true }),
  ]
})