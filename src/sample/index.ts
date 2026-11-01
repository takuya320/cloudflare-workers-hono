import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { HTTPException } from 'hono/http-exception'
import { stream, streamSSE } from 'hono/streaming'
import { v7 as uuidV7 } from 'uuid'
import { z } from 'zod'

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

// The chunk count and delay are bounded so a public endpoint cannot hold a
// connection open for long; tests pass intervalMs=0 to stay fast.
const streamQuerySchema = z.object({
  count: z.coerce.number().int().min(1).max(5).default(3),
  intervalMs: z.coerce.number().int().min(0).max(500).default(100),
})

const validateStreamQuery = zValidator(
  'query',
  streamQuerySchema,
  (result, c) => {
    if (!result.success) {
      return c.json({ error: result.error.issues[0].message }, 400)
    }
  },
)

// GET /stream - Plain chunked response, one line per interval
sample.get('/stream', validateStreamQuery, (c) => {
  const { count, intervalMs } = c.req.valid('query')
  c.header('Content-Type', 'text/plain; charset=utf-8')
  return stream(c, async (s) => {
    for (let i = 1; i <= count; i++) {
      await s.writeln(`chunk ${i}/${count}`)
      if (i < count) await s.sleep(intervalMs)
    }
  })
})

// GET /sse - Server-Sent Events: named events with ids, then a closing event
sample.get('/sse', validateStreamQuery, (c) => {
  const { count, intervalMs } = c.req.valid('query')
  return streamSSE(c, async (s) => {
    for (let i = 1; i <= count; i++) {
      await s.writeSSE({
        event: 'tick',
        id: String(i),
        data: JSON.stringify({ index: i, total: count }),
      })
      if (i < count) await s.sleep(intervalMs)
    }
    await s.writeSSE({ event: 'done', data: 'end' })
  })
})

sample.get('/error', () => {
  throw new HTTPException(400, { message: 'Bad Request' })
})

export default sample
