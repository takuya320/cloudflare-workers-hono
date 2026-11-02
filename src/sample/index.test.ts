import { describe, expect, it } from 'vitest'
import app from '@/index'

const MAX_BODY_BYTES = 1024

const postBody = (body: BodyInit, init: RequestInit = {}) =>
  app.request('/api/sample/body-limit', { method: 'POST', body, ...init })

describe('POST /api/sample/body-limit', () => {
  it('上限ちょうどのボディは受け付けて、バイト数を返すこと', async () => {
    const res = await postBody('a'.repeat(MAX_BODY_BYTES))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ bytes: MAX_BODY_BYTES })
  })

  it('上限を1バイト超えると413になること', async () => {
    const res = await postBody('a'.repeat(MAX_BODY_BYTES + 1))
    expect(res.status).toBe(413)
    expect(await res.json()).toEqual({ error: 'Payload Too Large' })
  })

  it('Content-Length が無いストリーム送信でも、上限超過なら413になること', async () => {
    const chunk = new TextEncoder().encode('a'.repeat(MAX_BODY_BYTES))
    const stream = () =>
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(chunk)
          controller.enqueue(chunk)
          controller.close()
        },
      })

    const res = await postBody(stream(), {
      duplex: 'half',
    } as RequestInit)
    expect(res.status).toBe(413)
  })
})

const readChunks = async (res: Response) => {
  const reader = (res.body as ReadableStream<Uint8Array>).getReader()
  const decoder = new TextDecoder()
  const chunks: string[] = []
  for (;;) {
    const { done, value } = await reader.read()
    if (done) return chunks
    chunks.push(decoder.decode(value))
  }
}

describe('GET /api/sample/stream', () => {
  it('チャンクごとに分けて届き、結合すると全行が揃うこと', async () => {
    const res = await app.request('/api/sample/stream?count=3&intervalMs=0')
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/plain')

    const chunks = await readChunks(res)
    // One read() per write proves the body was streamed, not buffered into one piece
    expect(chunks).toEqual(['chunk 1/3\n', 'chunk 2/3\n', 'chunk 3/3\n'])
  })

  it('クエリ省略時は既定の3チャンクになること', async () => {
    const res = await app.request('/api/sample/stream?intervalMs=0')
    expect(await readChunks(res)).toHaveLength(3)
  })

  it.each([
    'count=0',
    'count=6',
    'count=abc',
    'intervalMs=-1',
    'intervalMs=501',
  ])('範囲外のクエリ (%s) は400になること', async (query) => {
    const res = await app.request(`/api/sample/stream?${query}`)
    expect(res.status).toBe(400)
    expect(await res.json()).toHaveProperty('error')
  })
})

describe('GET /api/sample/sse', () => {
  it('SSE の Content-Type で、tick イベントの後に done イベントが届くこと', async () => {
    const res = await app.request('/api/sample/sse?count=2&intervalMs=0')
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/event-stream')

    const body = (await readChunks(res)).join('')
    const events = body
      .trim()
      .split('\n\n')
      .map((block) =>
        Object.fromEntries(
          block.split('\n').map((l) => l.split(/: (.*)/s).slice(0, 2)),
        ),
      )

    expect(events).toEqual([
      { event: 'tick', id: '1', data: '{"index":1,"total":2}' },
      { event: 'tick', id: '2', data: '{"index":2,"total":2}' },
      { event: 'done', data: 'end' },
    ])
  })

  it('範囲外のクエリは400になること', async () => {
    const res = await app.request('/api/sample/sse?count=99')
    expect(res.status).toBe(400)
  })
})
