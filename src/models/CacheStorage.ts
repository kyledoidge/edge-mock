import { EdgeCache } from "./Cache";

// @ts-ignore
type MultiCacheQueryOptions = {
  ignoreMethod?: boolean | undefined; // Allow more than just GET or HEAD requests
  ignoreSearch?: boolean | undefined; // Ignore query string ?x=1....
  // If true, you get from cache even if VARY header is *, meaning you cant cache since every request is different
  ignoreVary?: boolean | undefined; 
  cacheName?: string // Specific name of cache you want to search
}


export class EdgeCacheStorage implements CacheStorage {
  /** Default global cache */
  default: Cache;

  private caches: Record<string, Cache>;

  constructor() {
    this.default = new EdgeCache()
    this.caches = {}
    this.caches["default"] = this.default
  }


  /** Delete a custom cache */
  async delete(cacheName: string): Promise<boolean> {
    if (!this.caches[cacheName]) return false
    delete this.caches[cacheName]
    return true
  }

  /** Check a cache exists */
  async has(cacheName: string): Promise<boolean> {
    return !!this.caches[cacheName]
  }

  /** Returns array of cache names */
  async keys(): Promise<string[]> {
    return Object.keys(this.caches)
  }

  
  /** Checks for a match in all caches.*/
  async match(request: RequestInfo, options?: MultiCacheQueryOptions): Promise<Response | undefined> {
    let match: Response | undefined = undefined
    const keys = Object.keys(this.caches)
    for(let i = 0; i < keys.length; i++) {
      const key = keys[i]
      match = await this.caches[key].match(request)
      if (match) break
    }
    return match
  }

  /** Create a cache with cachename */
  async open(cacheName: string): Promise<Cache> {
    this.caches[cacheName] = new EdgeCache()
    return this.caches[cacheName]
  }  
}