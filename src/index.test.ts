import { describe, expect, it, test } from 'vitest'
import app from '@/index'

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

  describe('Global Error Handler', () => {
    it('予期せぬエラーが発生した場合、500エラーとなり機密情報が漏洩しないこと', async () => {
      const { Hono } = await import('hono')
      const { globalErrorHandler } = await import('@/index')
      const testApp = new Hono()

      testApp.onError(globalErrorHandler)

      testApp.get('/force-error', () => {
        throw new Error('This is a highly secret database error')
      })

      const originalConsoleError = console.error
      console.error = () => {}

      const res = await testApp.request('/force-error')

      console.error = originalConsoleError

      expect(res.status).toBe(500)
      const data = await res.json()
      expect(data.error).toBe('Internal Server Error')
      expect(JSON.stringify(data)).not.toContain('secret database error')
    })
  })
})
