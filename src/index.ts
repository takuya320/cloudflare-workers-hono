import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { requestId } from 'hono/request-id'
import test from './test'

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

app.route('/api/test', test)

export default app
