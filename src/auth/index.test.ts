import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import app from '@/index'

const env = { API_TOKENS: 'alice:alpha-token,bob:beta:with:colons' }

const getMe = (headers?: HeadersInit, bindings: object = env) =>
  app.request('/api/auth/me', { headers }, bindings)

describe('Bearer token auth', () => {
  beforeEach(() => {
    // Rejections are logged by the global error handler; keep test output clean
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('有効なトークンなら、トークンに対応するクライアント名が返ること', async () => {
    const res = await getMe({ Authorization: 'Bearer alpha-token' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ clientName: 'alice' })
  })

  it('コロンを含むトークンでも照合でき、別クライアントとして識別されること', async () => {
    const res = await getMe({ Authorization: 'Bearer beta:with:colons' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ clientName: 'bob' })
  })

  it('Authorization ヘッダーが無い場合は401と WWW-Authenticate が返ること', async () => {
    const res = await getMe()
    expect(res.status).toBe(401)
    expect(res.headers.get('WWW-Authenticate')).toBe('Bearer')
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })

  it('トークンが一致しない場合は401になること', async () => {
    const res = await getMe({ Authorization: 'Bearer wrong-token' })
    expect(res.status).toBe(401)
  })

  it('クライアント名をトークンとして送っても401になること', async () => {
    const res = await getMe({ Authorization: 'Bearer alice' })
    expect(res.status).toBe(401)
  })

  it('Bearer 以外のスキームは401になること', async () => {
    const res = await getMe({ Authorization: 'Basic alpha-token' })
    expect(res.status).toBe(401)
  })

  it('API_TOKENS が未設定の場合は、認証なしで通さず500になり設定名を漏らさないこと', async () => {
    const res = await getMe({ Authorization: 'Bearer alpha-token' }, {})
    expect(res.status).toBe(500)
    const text = await res.text()
    expect(text).not.toContain('API_TOKENS')
  })

  it('API_TOKENS が不正な形式（name:token になっていない）の場合も500になること', async () => {
    const res = await getMe(
      { Authorization: 'Bearer broken' },
      { API_TOKENS: 'broken' },
    )
    expect(res.status).toBe(500)
  })

  it('ゲートより前に登録した公開ルートはトークン無しで使えること', async () => {
    const health = await app.request('/health', {}, env)
    expect(health.status).toBe(200)
    const tasks = await app.request('/api/task', {}, env)
    expect(tasks.status).toBe(200)
  })

  it('未定義のパスはルートの有無を教えず、トークン無しなら401になること', async () => {
    const res = await app.request('/api/does-not-exist', {}, env)
    expect(res.status).toBe(401)
  })
})
