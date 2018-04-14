import { registerBridge } from '../'
import { Context } from '../../'

import purify = require('purify-css');
import { Bridge } from '../bridge';

registerBridge("fly.CSS", function getMinCSS(ctx: Context, bridge: Bridge, html:string, css:string) {
	return purify(html, css)
})
