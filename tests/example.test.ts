import {makeEdgeEnv} from 'edge-mock'
import stub_fetch from 'edge-mock/stub_fetch'
import {handleRequest} from './example'

describe('handleRequest', () => {
  beforeEach(() => {
    makeEdgeEnv({fetch: stub_fetch})
    jest.resetModules()
  })

  test('post', async () => {
    const request = new Request('https://example.com/?foo=1', {method: 'POST', body: 'hello'})
    const event = new FetchEvent('fetch', {request})
    const response = await handleRequest(event)
    expect(response.status).toEqual(200)
    expect(await response.json()).toStrictEqual({
      method: 'POST',
      headers: {accept: '*/*'},
      searchParams: {foo: '1'},
      body: 'hello',
    })
  })
})
