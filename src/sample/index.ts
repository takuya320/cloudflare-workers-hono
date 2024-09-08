import { Hono } from 'hono'
import { v7 as uuidv7 } from 'uuid'

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
    uuid: uuidv7(),
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

sample.get('/header', (c) => {
  const userAgent = c.req.header('User-Agent')
  const host = c.req.header('Host')
  return c.json({
    userAgent,
    host,
  })
})

export default sample
