import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { v7 as uuidV7 } from 'uuid'

const task = new Hono()

import { ApiError } from '@/error/ApiError'
import sampleData from './data.json'
import type { Task } from './schema'
import { createTaskSchema, updateTaskSchema } from './schema'

const taskMap = new Map<string, Task>()

export const resetTasks = () => {
  taskMap.clear()
  // Initialize with sample data from JSON
  sampleData.forEach((t) => {
    taskMap.set(t.id, {
      ...t,
      createdAt: new Date(t.createdAt),
    })
  })
}

// Initial seed
resetTasks()

// QUERY /search - Search tasks with a request body (RFC 10008)
task.query('/search', async (c) => {
  const contentType = c.req.header('Content-Type')
  if (!contentType?.startsWith('application/json')) {
    throw new ApiError(
      415,
      'Content-Type must be application/json',
      'QUERY /search rejected due to missing or unsupported Content-Type',
    )
  }

  let body: { title?: string; completed?: boolean } = {}
  try {
    body = await c.req.json()
  } catch {
    throw new ApiError(
      400,
      'Invalid JSON body',
      'QUERY /search failed to parse request body',
    )
  }

  let tasks = Array.from(taskMap.values())
  if (body.title !== undefined) {
    const title = body.title.toLowerCase()
    tasks = tasks.filter((t) => t.title.toLowerCase().includes(title))
  }
  if (body.completed !== undefined) {
    tasks = tasks.filter((t) => t.completed === body.completed)
  }

  return c.json({ tasks })
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
task.post(
  '/',
  zValidator('json', createTaskSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: result.error.issues[0].message }, 400)
    }
  }),
  async (c) => {
    const body = c.req.valid('json')

    const newTask: Task = {
      id: uuidV7(),
      title: body.title,
      completed: false,
      createdAt: new Date(),
    }
    taskMap.set(newTask.id, newTask)

    return c.json({ task: newTask }, 201)
  },
)

// PUT /:id - Update a task
task.put(
  '/:id',
  zValidator('json', updateTaskSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: result.error.issues[0].message }, 400)
    }
  }),
  async (c) => {
    const id = c.req.param('id')
    const t = taskMap.get(id)
    if (!t) {
      throw new ApiError(
        404,
        'Task not found',
        `Task ID ${id} was not found during PUT request`,
      )
    }

    const body = c.req.valid('json')

    if (body.title !== undefined) t.title = body.title
    if (body.completed !== undefined) t.completed = body.completed

    taskMap.set(id, t)
    return c.json({ task: t })
  },
)

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
