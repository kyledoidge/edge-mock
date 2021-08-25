import live_fetch from '../live_fetch'
import LRUCache from 'lru-cache'
import {EdgeRequest} from './Request'

export type CacheQueryOptions = {
  ignoreMethod?: boolean | undefined // Allow more than just GET or HEAD requests
  ignoreSearch?: boolean | undefined // Ignore query string ?x=1....
  // If true, you get from cache even if VARY header is *, meaning you cant cache since every request is different
  ignoreVary?: boolean | undefined
}

const MAX_ITEMS = 100000

export class EdgeCache implements Cache {
  private cache: LRUCache<string, Response>

  constructor() {
    this.cache = new LRUCache({max: MAX_ITEMS})
  }

  private getKey(request: RequestInfo): string {
    if (typeof request === 'string') request = new EdgeRequest(request)
    return request.url
  }

  getTTL (response: Response | Request): number {
    let ttl = 100 // 100 seconds
    let cacheControl: string | string[] | null = response.headers.get('cache-control')
    if (cacheControl !== null) {
      cacheControl = cacheControl.split(';').map(val => val.trim())
      const maxAge = cacheControl.find(value => value.toLowerCase().includes('max-age'))
      if (maxAge !== undefined) {
        ttl = parseInt(maxAge.split('=')[1])
      }
    }
    return ttl
  }

  /** Fetches url and caches it */
  async add(request: RequestInfo): Promise<void> {
    let ttl = 100
    if (request instanceof Request) {
      ttl = this.getTTL(request)
    }
    const key = this.getKey(request)
    const res = await live_fetch(key)
    this.cache.set(key, res, ttl * 1000)
  }

  async addAll(requests: RequestInfo[]): Promise<void> {
    for (let i = 0; i < requests.length; i++) {
      await this.add(requests[i])
    }
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
    if (request) {
      const res = await this.match(request, options)
      if (!res) return []
      return [res]
    } else {
      return this.cache.values()
    }
  }
  async put(request: RequestInfo, response: Response): Promise<void> {
    const ttl = this.getTTL(response)
    const key = this.getKey(request)
    this.cache.set(key, response, ttl * 1000)
  }
}
