/**
 * An API for efficiently caching Response objects in the regional Fly cache.
 * 
 * Usage:
 * 
 * ```javascript
 * import { responseCache } from "@fly/cache"
 * 
 * const resp = await fetch("http://example.com")
 * 
 * // cache for an hour
 * await responseCache.set("example-com", resp, 3600)
 * 
 * const cachedResponse = await responseCache.get("example-com")
 * ```
 * 
 * See {@link fly/cache} for caching lower level types.
 * @preferred
 * @module fly/cache/response
 */

/** */
import cache, { CacheSetOptions } from "."

/**
 * Response metadata suitable for caching
 */
export interface Metadata {
  status: number,
  headers: { [key: string]: string | null},
  at?: number,
  ttl: number,
  tags?: string[]
}

export interface ResponseCacheSetOptions extends CacheSetOptions {
  skipCacheHeaders?: string[]
}

/**
 * A response with cache info attached
 */
export type CachedResponse = Response & {
  key: string
}

/**
 * Get a Response object from cache.
 * @param key cache key to get
 * @return The response associated with the key, or null if empty
 */
export async function get(key: string) {
  let [meta, body] = await Promise.all(
    [
      getMeta(key),
      cache.get(key + ":body")
    ]
  )

  if (!meta || !body) return null; // miss
  let age = 0;
  if (meta.at) {
    age = Math.round(Date.now() / 1000) - meta.at;
    meta.headers.Age = age.toString();
    meta.headers['Fly-Age'] = meta.headers.Age;
    delete meta.at;
  }
  const resp = new Response(body, meta)
  return <CachedResponse>Object.assign(resp, { key: key });
}

/**
 * Gets Request metatadata from the cache
 * @param key cache key to get metadata for
 */
export async function getMeta(key: string) {
  let meta: string | undefined | Metadata = await cache.getString(key + ':meta');
  if (!meta) return; // cache miss
  try {
    meta = <Metadata>JSON.parse(meta);
  } catch (err) {
    return null; // also a miss
  }
  return meta
}

/**
 * 
 * @param key Cache key to set
 * @param meta Metadata for the Response
 * @param opts Time to live
 */
export function setMeta(key: string, meta: Metadata, options?: CacheSetOptions | number) {
  return cache.set(key + ":meta", JSON.stringify(meta), options)
}

const defaultSkipHeaders = [
  'authorization',
  'set-cookie'
];

/**
 * Stores a Response object in the Fly cache.
 * @param key Cache key to set
 * @param resp The response to cache
 * @param options Time to live
 */
export async function set(key: string, resp: Response, options?: ResponseCacheSetOptions | number) {
  const ttl = typeof options === "number" ? options : (options && options.ttl);
  let tags: string[] | undefined = undefined;
  let skipHeaderOption: string[] = defaultSkipHeaders;
  if (typeof options === "object") {
    tags = options.tags;
    skipHeaderOption = [...skipHeaderOption, ...(options.skipCacheHeaders || []).map((headerKey) => headerKey.toLowerCase())];
  }

  const meta = {
    status: resp.status,
    headers: {},
    at: Math.round(Date.now() / 1000),
    ttl: ttl,
    tags: tags
  }

  const body = await resp.clone().arrayBuffer();

  let etag = resp.headers.get("etag")
  if (!etag || etag == '') {
    etag = hex(await crypto.subtle.digest("SHA-1", body))
    resp.headers.set("etag", etag)
  }

  const skipHeaderSet = new Set(skipHeaderOption);
  for(const headerSet of resp.headers as any) {
    const [name, value] = headerSet;
    if (skipHeaderSet.has(name.toLowerCase())) {
      continue;
    }

    const existingVal = meta.headers[name];
    if (existingVal) {
      meta.headers[name] = `${existingVal}, ${value}`;
    } else {
      meta.headers[name] = value;
    }
  }
  return cacheResult([
    setMeta(key, meta, options),
    cache.set(key + ':body', body, options)
  ]);
}

/**
 * Resets the "age" of the cached Response object
 * @param key Response to "touch"
 */
export async function touch(key: string) {
  let meta = await getMeta(key)
  if (!meta) return false
  meta.at = Math.round(Date.now() / 1000)
  return await setMeta(key, meta, { ttl: meta.ttl, tags: meta.tags })
}

/**
 * Sets a new expiration time for a Response object
 * @param key Key to set an expiration for
 * @param ttl Time to live
 */
export async function expire(key: string, ttl: number) {
  return cacheResult([
    cache.expire(key + ":meta", ttl),
    cache.expire(key + ":body", ttl)
  ])
}

/**
 * Replace tags for a cached Response
 * @param key The key to modify
 * @param tags Tags to apply to key
 * @returns true if tags were successfully updated
 */
export function setTags(key: string, tags: string[]) {
  return cacheResult([
    cache.setTags(key + ":meta", tags),
    cache.setTags(key + ":body", tags)
  ])
}

/**
 * Deletes a Response object from the cache
 * @param key Key to delete
 */
export async function del(key: string) {
  return cacheResult([
    cache.del(key + ":meta"),
    cache.del(key + ":body")
  ])
}

export default {
  get,
  getMeta,
  set,
  setTags,
  touch,
  expire,
  del
}

async function cacheResult(ops: Promise<boolean>[]) {
  const results = await Promise.all(ops)

  for (const r of results) {
    if (r === false) {
      return false
    }
  }
  return true
}

// converts a buffer to hex, mainly for hashes
function hex(buffer: ArrayBuffer) {
  let hexCodes = [];
  let view = new DataView(buffer);
  for (let i = 0; i < view.byteLength; i += 4) {
    // Using getUint32 reduces the number of iterations needed (we process 4 bytes each time)
    let value = view.getUint32(i)
    // toString(16) will give the hex representation of the number without padding
    let stringValue = value.toString(16)
    // We use concatenation and slice for padding
    let padding = '00000000'
    let paddedValue = (padding + stringValue).slice(-padding.length)
    hexCodes.push(paddedValue);
  }

  // Join all the hex strings into one
  return hexCodes.join("");
}