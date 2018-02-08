//import { conf } from './config'
import * as winston from 'winston';

export default new winston.Logger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    new winston.transports.Console({ timestamp: true }),
  ]
})