import LRUCache from "lru-cache"
import {EdgeRequest} from "./Request"
import {EdgeResponse} from "./Response"
import fetch, {Request as NodeRequest} from "node-fetch"

export type CacheQueryOptions = {
  ignoreMethod?: boolean | undefined; // Allow more than just GET or HEAD requests
  ignoreSearch?: boolean | undefined; // Ignore query string ?x=1....
  // If true, you get from cache even if VARY header is *, meaning you cant cache since every request is different
  ignoreVary?: boolean | undefined; 
}

const MAX_ITEMS = 100000

export class EdgeCache implements Cache {
  private cache: LRUCache<string, Response>

  constructor() {
    this.cache = new LRUCache({ max: MAX_ITEMS })
  }

  private getKey(request: RequestInfo): string {
    if (typeof request === "string") request = new EdgeRequest(request)
    return request.url
  }

  /** Fetches url and caches it */
  async add(request: RequestInfo): Promise<void> {
    const key = this.getKey(request)
    let requestObj = new NodeRequest(key)
    requestObj = Object.assign(requestObj, request)
    const res = await fetch(requestObj)
    const headers: Record<string, string> = {}
    res.headers.forEach((value: string, name: string) => {
      headers[name] = value
    })
    const edgeRes = new EdgeResponse(await res.arrayBuffer(), 
      {headers, status: res.status, statusText: res.statusText})
    this.cache.set(key, edgeRes)
  }

  async addAll(requests: RequestInfo[]): Promise<void> {
    requests.forEach((request) => {
      this.add(request)
    })
  }
  async delete(request: RequestInfo, options?: CacheQueryOptions): Promise<boolean> {
    const key = this.getKey(request)
    
    if (!this.cache.has(key)) return false

    this.cache.del(key)
    return true
  }
  async keys(request?: RequestInfo, options?: CacheQueryOptions): Promise<readonly Request[]> {
    return this.cache.keys().map(key => new EdgeRequest(key))
  }
  async match(request: RequestInfo, options?: CacheQueryOptions): Promise<Response | undefined> {
    const key = this.getKey(request)
    return this.cache.get(key)
  }
  /** Basically match but returns array. -_-*/
  async matchAll(request?: RequestInfo, options?: CacheQueryOptions): Promise<readonly Response[]> {
    if (request){
      const res = await this.match(request, options)
      if (!res) return []
      return [res]
    } else {
      return this.cache.values()
    }
  }
  async put(request: RequestInfo, response: Response): Promise<void> {
    const key = this.getKey(request)
    this.cache.set(key, response);
  }
  
}