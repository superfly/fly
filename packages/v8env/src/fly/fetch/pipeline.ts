/**
 * A library for composing `fetch` generators into a single pipeline.
 * 
 * @preferred
 * @module fly/fetch/pipeline
 */

import { FetchGenerator, FetchFunction } from "./"


/**
 * PipeplineStage can either be a FetchGenerator function, or a tuple of 
 * FetchGenerator + args.
 */
export type PipelineStage = FetchGenerator | [FetchGenerator, any[]]


/**
 * Combine multiple fetches into a single function. Allows middleware type functionality
 * 
 * Example:
 * 
 * ```javascript
 * import { pipeline } from "@fly/fetch/pipeline"
 * 
 * const addHeader = function(fetch){
 *   return function(req, init){
 *     if(typeof req === "string") req = new Request(req, init)
 *     req.headers.set("Superfly-Header", "shazam")
 *     return fetch(req, init)
 *   }
 * }
 * 
 * const p = pipeline(fetch, addHeader)
 * 
 * fly.http.respondWith(p)
 * 
 * @param stages fetch generator functions that apply additional logic
 * @returns a combinedfunction that can be used anywhere that wants `fetch`
 */
export function pipeline(...stages: PipelineStage[]) {
  /**
   * @param fetch the "origin" fetch function to call at the end of the pipeline
   */
  function pipelineFetch(fetch: FetchFunction) {
    for (let i = stages.length - 1; i >= 0; i--) {
      const s = stages[i]
      const fn = (typeof s === "function") ? s : s[0]
      const opts = (s instanceof Array) ? s[1] : []
      fetch = fn(fetch, opts)
    }
    return Object.assign(fetch, { stages: stages })
  }

  return Object.assign(pipelineFetch, { stages: stages })
}

export default pipeline;