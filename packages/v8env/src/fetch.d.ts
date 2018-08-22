/**
 * Fetch is a set of methods and classes for making HTTP requests. This module implements 
 * the [WhatWG fetch standard](https://fetch.spec.whatwg.org).
 * @module fetch
 */
/**
 * The `fetch()` method starts the process of fetching a resource form the network.
 * This returns a promise that resolves to the `Response` object representing the
 * response to your request.
 */
export declare function fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;

export type RequestInfo = Request | string;

export interface RequestInit {
  signal?: AbortSignal;
  body?: Blob | BufferSource | FormData | string | null;
  cache?: RequestCache;
  credentials?: RequestCredentials;
  headers?: HeadersInit;
  integrity?: string;
  keepalive?: boolean;
  method?: string;
  mode?: RequestMode;
  redirect?: RequestRedirect;
  referrer?: string;
  referrerPolicy?: ReferrerPolicy;
}

export interface Response extends Object, Body {
  readonly body: ReadableStream | null;
  readonly headers: Headers;
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly type: ResponseType;
  readonly url: string;
  readonly redirected: boolean;
  clone(): Response;
}