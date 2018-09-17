/**
 * @private
 * @module fly
 */
/** @hidden */
declare module "util" {
  // Temporarily mark all arguments as optional because arrays can't be spread into functions
  // with 1+ required arguments as seen in fly/log.ts
  // This can likely be removed once we're on Typescript 3 https://blogs.msdn.microsoft.com/typescript/2018/07/12/announcing-typescript-3-0-rc/#tuples-and-parameters
  export function format(...param: any[]): string
  // export function format(format: any, ...param: any[]): string;
}
