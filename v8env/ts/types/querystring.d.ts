declare module "querystring" {
  export interface StringifyOptions {
    encodeURIComponent?: Function;
  }

  export interface ParseOptions {
    maxKeys?: number;
    decodeURIComponent?: Function;
  }

  interface ParsedUrlQuery { [key: string]: string | string[]; }

  export function stringify<T>(obj: T, sep?: string, eq?: string, options?: StringifyOptions): string;
  export function parse(str: string, sep?: string, eq?: string, options?: ParseOptions): ParsedUrlQuery;
  export function parse<T extends {}>(str: string, sep?: string, eq?: string, options?: ParseOptions): T;
  export function escape(str: string): string;
  export function unescape(str: string): string;
}
