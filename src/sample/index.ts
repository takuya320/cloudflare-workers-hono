import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { v7 as uuidV7 } from 'uuid'

const sample = new Hono()

sample.get('/', (c) => {
  return c.json({
    message: 'Sample API',
  })
})

sample.get('/now', (c) => {
  return c.json({
    now: new Date().toISOString(),
  })
})

sample.get('/uuid', (c) => {
  return c.json({
    uuid: uuidV7(),
  })
})

sample.get('/param/:id', (c) => {
  const id = c.req.param('id')
  return c.json({
    param: id,
  })
})

sample.get('/query', (c) => {
  const query = c.req.query()
  return c.json({
    query,
  })
})

const sampleItems = [
  { id: 1, name: 'apple', category: 'fruit' },
  { id: 2, name: 'banana', category: 'fruit' },
  { id: 3, name: 'carrot', category: 'vegetable' },
  { id: 4, name: 'broccoli', category: 'vegetable' },
]

sample.query('/search', async (c) => {
  const contentType = c.req.header('Content-Type')
  if (!contentType?.startsWith('application/json')) {
    throw new HTTPException(415, {
      message: 'Content-Type must be application/json',
    })
  }

  let body: { name?: string; category?: string } = {}
  try {
    body = await c.req.json()
  } catch {
    throw new HTTPException(400, { message: 'Invalid JSON body' })
  }

  let results = sampleItems
  if (body.name !== undefined) {
    const name = body.name.toLowerCase()
    results = results.filter((item) => item.name.includes(name))
  }
  if (body.category !== undefined) {
    const category = body.category.toLowerCase()
    results = results.filter((item) => item.category === category)
  }

  return c.json({ query: body, results })
})

sample.get('/header', (c) => {
  const userAgent = c.req.header('User-Agent')
  const host = c.req.header('Host')
  return c.json({
    userAgent,
    host,
  })
})

sample.get('/error', (c) => {
  throw new HTTPException(400, { message: 'Bad Request' })
})

export default sample
