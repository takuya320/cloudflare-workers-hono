import { Hono } from 'hono'
import { v7 as uuidV7 } from 'uuid'

const task = new Hono()

import type { Task } from './types'
import sampleData from './data.json'

const taskMap = new Map<string, Task>()

// Initialize with sample data from JSON
sampleData.forEach((t) => {
  taskMap.set(t.id, {
    ...t,
    createdAt: new Date(t.createdAt),
  })
})

// GET / - Read all tasks
task.get('/', (c) => {
  const tasks = Array.from(taskMap.values())
  return c.json({ tasks })
})

// GET /:id - Read a specific task
task.get('/:id', (c) => {
  const id = c.req.param('id')
  const t = taskMap.get(id)
  if (!t) {
    return c.json({ error: 'Task not found' }, 404)
  }
  return c.json({ task: t })
})

// POST / - Create a new task
task.post('/', async (c) => {
  let body: { title?: string } = {}
  try {
    body = await c.req.json()
  } catch (e) {
    // ignore
  }

  if (!body.title) {
    return c.json({ error: 'Title is required' }, 400)
  }

  const newTask: Task = {
    id: uuidV7(),
    title: body.title,
    completed: false,
    createdAt: new Date(),
  }
  taskMap.set(newTask.id, newTask)

  return c.json({ task: newTask }, 201)
})

// PUT /:id - Update a task
task.put('/:id', async (c) => {
  const id = c.req.param('id')
  const t = taskMap.get(id)
  if (!t) {
    return c.json({ error: 'Task not found' }, 404)
  }

  let body: { title?: string; completed?: boolean } = {}
  try {
    body = await c.req.json()
  } catch (e) {
    // ignore
  }

  if (body.title !== undefined) t.title = body.title
  if (body.completed !== undefined) t.completed = body.completed

  taskMap.set(id, t)
  return c.json({ task: t })
})

// DELETE /:id - Delete a task
task.delete('/:id', (c) => {
  const id = c.req.param('id')
  if (!taskMap.has(id)) {
    return c.json({ error: 'Task not found' }, 404)
  }
  taskMap.delete(id)
  return c.json({ success: true })
})

export default task
