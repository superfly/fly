/**
 * @module fetch
 */
/**
 * The `fetch()` method starts the process of fetching a resource form the network.
 * This returns a promise that resolves to the `Response` object representing the
 * response to your request.
 */
declare function fetch(input: FlyRequestInfo, init?: RequestInit): Promise<Response>;

type FlyRequestInfo = Request | string;

interface RequestInit {
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

interface Response extends Object, Body {
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