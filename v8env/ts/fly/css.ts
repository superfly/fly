/**
 * @module fly
 */
import { transferInto } from "../utils/buffer";
/**
   * Constructs a new CSS class from css and html string
   * @param css a string of css
	 * @param html a string of html
   */
export function CSS (css: string, html: string) {
	if (typeof css !== 'string' || typeof html !== 'string')
		throw new Error ('must be given two strings')
	console.log('looking for html:',( html != null && css != null))
	return getMinCSS(css, html)
}


/**
 * @hidden
 */
let getMinCSS: (css: string, html: string) => string

export default function initCSS(ivm: any, dispatcher: any) {
  getMinCSS = function (css: string, html: string) {
    return dispatcher.dispatchSync("fly.CSS", html, css)
  }

	return CSS
}
