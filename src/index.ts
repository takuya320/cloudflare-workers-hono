import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { logger } from 'hono/logger'
import { requestId } from 'hono/request-id'
import sample from './sample'
import task from './task'

const app = new Hono()

app.use('*', requestId())

const customLogger = (message: string, ...rest: string[]) => {
  console.log('custom log', message, ...rest)
}
app.use(logger(customLogger))

app.use(
  '*',
  cors({
    origin: 'http://localhost:3000',
    allowHeaders: [
      'ConTent-Type',
      'Access-Control-Allow-Origin',
      'X-Custom-Header',
      'Upgrade-Insecure-Requests',
    ],
    allowMethods: ['GET', 'HEAD', 'OPTIONS'],
    exposeHeaders: ['X-Custom-Header', 'Content-Disposition'],
    maxAge: 600,
    credentials: true,
  }),
)

app.get('/', (c) => {
  return c.json({
    message: 'Hello, World!',
    requestId: c.get('requestId'),
  })
})
app.get('/health', (c) => {
  return c.text('OK')
})

app.route('/api/sample', sample)
app.route('/api/task', task)

app.onError((err, c) => {
  console.error(err)
  if (err instanceof HTTPException) {
    // Get the custom response
    return err.getResponse()
  }
  return c.json(
    {
      error: err.message,
    },
    500,
  )
})

export default app
