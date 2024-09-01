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

export default test
