/* eslint-disable unused-imports/no-unused-imports */
import {makeEdgeEnv} from 'edge-mock'
import stub_fetch from 'edge-mock/stub_fetch'
makeEdgeEnv({fetch: stub_fetch})

const cacheName = "SomeCache"
describe('EdgeCacheStorage', () => {
  test('Can open a cache', async () => {
    const cache = await caches.open(cacheName)
    expect(await caches.has(cacheName)).toBeTruthy()
    expect(cache instanceof Cache).toBeTruthy()
  })

  test('Can delete a cache', async () => {
    await caches.open(cacheName)
    await caches.delete(cacheName)
    expect(await caches.has(cacheName)).toBeFalsy()
  })

  test('Can get all Cache names', async () => {
    const cacheNames = ["cache1", "cache2", "cache3"].sort()
    for(let i = 0; i < cacheNames.length; i++) {
      await caches.open(cacheNames[i])
    }
    let actualCacheNames = (await caches.keys()).sort()
    actualCacheNames = actualCacheNames.filter(val =>  val !== "default") // Remove default cache
    expect(actualCacheNames).toEqual(cacheNames)
  })

  test('Can match against any cache', async () => {
    const cacheNames = ["cache1", "cache2", "cache3"]
    for(let i = 0; i < cacheNames.length; i++) {
      const cache = await caches.open(cacheNames[i])
      await cache.put(String(i), new Response(String(i)))
    }
    const response = await caches.match("0") as Response
    const responseText = await response.text()
    expect(responseText).toEqual("0")
  })
})