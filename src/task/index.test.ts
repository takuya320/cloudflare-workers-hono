import { describe, expect, it } from 'vitest'
import app from '../index'

describe('Task API', () => {
  let createdTaskId: string

  it('GET /api/task - 既存のサンプルタスクが取得できること', async () => {
    const res = await app.request('/api/task')
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.tasks).toBeInstanceOf(Array)
    expect(data.tasks.length).toBeGreaterThanOrEqual(2)
  })

  it('POST /api/task - 新しいタスクを作成できること', async () => {
    const res = await app.request('/api/task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Test Task' }),
    })
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.task.title).toBe('New Test Task')
    expect(data.task.completed).toBe(false)
    expect(data.task.id).toBeDefined()
    createdTaskId = data.task.id
  })

  it('POST /api/task - titleが無い場合は400エラーになること', async () => {
    const res = await app.request('/api/task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Title is required')
  })

  it('GET /api/task/:id - 作成したタスクを取得できること', async () => {
    const res = await app.request(`/api/task/${createdTaskId}`)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.task.id).toBe(createdTaskId)
    expect(data.task.title).toBe('New Test Task')
  })

  it('GET /api/task/:id - 存在しないIDの場合は404エラーになること', async () => {
    const res = await app.request('/api/task/invalid-id')
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('Task not found')
  })

  it('PUT /api/task/:id - タスクを更新できること', async () => {
    const res = await app.request(`/api/task/${createdTaskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true, title: 'Updated Test Task' }),
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.task.completed).toBe(true)
    expect(data.task.title).toBe('Updated Test Task')
  })

  it('PUT /api/task/:id - 存在しないIDの場合は404エラーになること', async () => {
    const res = await app.request('/api/task/invalid-id', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    })
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('Task not found')
  })

  it('DELETE /api/task/:id - タスクを削除できること', async () => {
    const res = await app.request(`/api/task/${createdTaskId}`, {
      method: 'DELETE',
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)

    // 削除確認
    const verifyRes = await app.request(`/api/task/${createdTaskId}`)
    expect(verifyRes.status).toBe(404)
  })

  it('DELETE /api/task/:id - 存在しないIDの場合は404エラーになること', async () => {
    const res = await app.request('/api/task/invalid-id', {
      method: 'DELETE',
    })
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('Task not found')
  })
})
