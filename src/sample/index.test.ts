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
