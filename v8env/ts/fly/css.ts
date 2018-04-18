/**
 * @module fly
 */
import { transferInto } from '../utils/buffer';
/**
   * Removes the unsued css from a string of css
   * @param css a string of css
	 * @param html a string of html
   */
export function removeUnused(css: string, html: string) {
  if (typeof css !== 'string' || typeof html !== 'string')
    throw new Error('must be given two strings');
  return getMinCSS(css, html);
}

/**
 * @hidden
 */
let getMinCSS: (css: string, html: string) => string;

export default function initCSS(ivm: any, dispatcher: any) {
  getMinCSS = function(css: string, html: string) {
    return dispatcher.dispatchSync('fly.removeUnused', html, css);
  };

  return {
    removeUnused: removeUnused
  };
}
