/**
 * @module fly
 */
import { transferInto } from '../utils/buffer';
/**
   * Constructs a new CSS class from css and html string
   * @param css a string of css
	 * @param html a string of html
   */
export function removeUnused(css: string, html: string) {
  if (typeof css !== 'string' || typeof html !== 'string')
    throw new Error('must be given two strings');
  return getMinCSS(css, html);
}

/**
   * Constructs a new CSS class from css and html string
   * @param css a string of css
   */
export function minify(css: string) {
  if (typeof css !== 'string') throw new Error('must be given two strings');
  return getMinify(css);
}

/**
 * @hidden
 */
let getMinCSS: (css: string, html: string) => string;

/**
 * @hidden
 */
let getMinify: (css: string) => string;

export default function initCSS(ivm: any, dispatcher: any) {
  getMinCSS = function(css: string, html: string) {
    return dispatcher.dispatchSync('fly.removeUnused', html, css);
  };

  getMinify = function(css: string) {
    return dispatcher.dispatchSync('fly.getMinify', css);
  };

  return {
    removeUnused: removeUnused,
    minify: minify
  };
}
