import { describe, expect, it, test } from 'vitest'
import app from '../src/index'

test('example test', () => {
  expect(1 + 1).toBe(2)
})

describe('Hono App', () => {
  it('should return OK for GET /health', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('OK')
  })

  it('should return message and requestId for GET /', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(200)
    const data: { message: string; requestId: string } = await res.json()
    expect(data).toHaveProperty('message')
    expect(data.message).toBe('Hello, World!')
    expect(data).toHaveProperty('requestId')
    // UUIDの正規表現パターン
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    expect(data.requestId).toMatch(uuidPattern)
  })
})
