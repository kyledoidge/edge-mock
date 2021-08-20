/* eslint-disable unused-imports/no-unused-imports */
import {makeEdgeEnv} from 'edge-mock'
import stub_fetch from 'edge-mock/stub_fetch'
makeEdgeEnv({fetch: stub_fetch})

async function getKey(request: RequestInfo): Promise<string> {
  if (typeof request === "string") request = new Request(request)
  return request.url
}

describe('EdgeCache', () => {
  test('add fetches live website and caches', async () => {
    const testRequest = new Request("http://example.com")
    
    const cache = new Cache()
    await cache.add(testRequest)

    const res = await cache.match(testRequest) as Response
    const resText = await res.text()
    
    expect(resText).toContain("<html>")
  })

  test('Put adds an item. Match retreives it', async () => {    
    const cache = new Cache()
    const key = "test"
    await cache.put(key, new Response("Hello"))

    const res = await cache.match(key) as Response
    const resText = await res.text()
    
    expect(resText).toEqual("Hello")
  })

  test('MatchAll with no params gets all response values', async () => {    
    const cache = new Cache()
    for(let i = 0; i < 5; i++) {
      await cache.put(String(i), new Response(`test:${i}`))
    }

    // @ts-ignore readonly warning
    const responses = (await cache.matchAll()).reverse() // lru-cache is LIFO
    responses.forEach(async (res: Response, index: number) => {
      const resText = await res.text()
      expect(resText).toEqual(`test:${index}`)
    })
  })


  test('AddAll adds multiple requests', async () => {    
    const cache = new Cache()
    const expectedKeys = ["https://example.com/foo", "https://example.com/bar", "https://example.com/something"]
    await cache.addAll(expectedKeys)


    const actualKeys = (await cache.keys()).map(req => req.url)
    // Keys are added in a LIFO structure
    actualKeys.reverse()

    expect(actualKeys).toEqual(expectedKeys)
  })
})