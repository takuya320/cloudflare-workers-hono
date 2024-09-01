import { Hono } from 'hono'
import { v7 as uuidv7 } from 'uuid'

const test = new Hono()

test.get('/now', (c) => {
  return c.json({
    now: new Date().toISOString(),
  })
})

test.get('/uuid', (c) => {
  return c.json({
    uuid: uuidv7(),
  })
})

test.get('/param/:id', (c) => {
  const id = c.req.param('id')
  return c.json({
    param: id,
  })
})

test.get('/query', (c) => {
  const query = c.req.query()
  return c.json({
    query,
  })
})

test.get('/header', (c) => {
  const userAgent = c.req.header('User-Agent')
  const host = c.req.header('Host')
  return c.json({
    userAgent,
    host,
  })
})

export default test
