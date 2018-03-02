declare module "cookie" {
  export interface CookieSerializeOptions {
    domain?: string;
    encode?(val: string): string;
    expires?: Date;
    httpOnly?: boolean;
    maxAge?: number;
    path?: string;
    sameSite?: boolean | 'lax' | 'strict';
    secure?: boolean;
  }

  export interface CookieParseOptions {
    decode?(val: string): string;
  }

  export function parse(str: string, options?: CookieParseOptions): { [key: string]: string };
  export function serialize(name: string, val: string, options?: CookieSerializeOptions): string;
}