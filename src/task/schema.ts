import { z } from 'zod'

export const taskSchema = z.object({
  id: z.string().uuid(),
  title: z.string({ required_error: 'Title is required' }).min(1, 'Title is required'),
  completed: z.boolean(),
  createdAt: z.date(),
})

export type Task = z.infer<typeof taskSchema>

export const createTaskSchema = z.object({
  title: z.string({ required_error: 'Title is required' }).min(1, 'Title is required'),
})

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  completed: z.boolean().optional(),
})
