import { Hono } from 'hono'
import { v7 as uuidV7 } from 'uuid'

const task = new Hono()

class Task {
  id: string
  createdAt: Date

  constructor(id: string) {
    this.id = id
    this.createdAt = new Date()
  }
}

const taskMap = new Map<string, Task>()

task.get('/', (c) => {
  console.log('taskMap', taskMap)
  const tasks: Task[] = []
  taskMap.forEach((value, key) => {
    tasks.push(value)
  })
  return c.json({
    tasks: tasks,
  })
})

task.get('/add', (c) => {
  console.log('taskMap', taskMap)
  const task = new Task(uuidV7())
  taskMap.set(task.id, task)
  return c.json({
    success: true,
  })
})

export default task
