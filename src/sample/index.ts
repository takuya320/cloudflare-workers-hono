import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
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

sample.get('/header', (c) => {
  const userAgent = c.req.header('User-Agent')
  const host = c.req.header('Host')
  return c.json({
    userAgent,
    host,
  })
})

// Workers accepts far larger bodies than this API ever needs, so cap it here
// instead of parsing whatever a client sends.
const MAX_BODY_BYTES = 1024

sample.post(
  '/body-limit',
  bodyLimit({
    maxSize: MAX_BODY_BYTES,
    onError: (c) => c.json({ error: 'Payload Too Large' }, 413),
  }),
  async (c) => {
    const body = await c.req.arrayBuffer()
    return c.json({ bytes: body.byteLength })
  },
)

sample.get('/error', () => {
  throw new HTTPException(400, { message: 'Bad Request' })
})

export default sample
