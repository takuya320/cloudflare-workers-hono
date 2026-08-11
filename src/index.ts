import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { logger } from 'hono/logger'
import { requestId } from 'hono/request-id'
import sample from './sample'
import task from './task'
import { ApiError } from './error/ApiError'

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
      'Content-Type',
      'X-Custom-Header',
      'Upgrade-Insecure-Requests',
    ],
    allowMethods: ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'DELETE'],
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
  if (err instanceof ApiError) {
    console.error(
      `[ApiError] ${err.statusCode}:`,
      err.internalMessage || err.clientMessage,
      '\n',
      err.stack,
    )
    return c.json({ error: err.clientMessage }, err.statusCode)
  }

  if (err instanceof HTTPException) {
    console.error(
      `[HTTPException] ${err.status}:`,
      err.message,
      '\n',
      err.stack,
    )
    return err.getResponse()
  }

  // Log unknown/unhandled errors fully for internal debugging
  console.error('[UnhandledError]:', err)

  // Return a generic error message to the client, preventing any leakage of sensitive data
  return c.json(
    {
      error: 'Internal Server Error',
    },
    500,
  )
})

export default app
