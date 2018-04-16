import { registerBridge } from '../';
import { Context } from '../../';

import purify = require('purify-css');
import { processString } from 'uglifycss';
import { Bridge } from '../bridge';

registerBridge('fly.removeUnused', function getMinCSS(
  ctx: Context,
  bridge: Bridge,
  html: string,
  css: string
) {
  return purify(html, css);
});

registerBridge('fly.getMinify', function getMinCSS(
  ctx: Context,
  bridge: Bridge,
  css: string
) {
  return processString(css);
});
