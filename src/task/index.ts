import { Hono } from 'hono'
import { v7 as uuidV7 } from 'uuid'

const task = new Hono()

import type { Task } from './types'
import { ApiError } from '../error/ApiError'
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
    throw new ApiError(
      404,
      'Task not found',
      `Task ID ${id} was not found during GET request`,
    )
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
    throw new ApiError(
      400,
      'Title is required',
      'Task creation failed due to missing title',
    )
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
    throw new ApiError(
      404,
      'Task not found',
      `Task ID ${id} was not found during PUT request`,
    )
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
    throw new ApiError(
      404,
      'Task not found',
      `Task ID ${id} was not found during DELETE request`,
    )
  }
  taskMap.delete(id)
  return c.json({ success: true })
})

export default task
