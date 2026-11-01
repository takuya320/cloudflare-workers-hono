import { type ErrorHandler, Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { logger } from 'hono/logger'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import auth from '@/auth'
import { type AuthEnv, requireApiToken } from '@/auth/middleware'
import { ApiError } from '@/error/ApiError'
import sample from '@/sample'
import task from '@/task'

const app = new Hono<AuthEnv>()

app.use('*', requestId())
app.use('*', secureHeaders())

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
    allowMethods: ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'DELETE', 'QUERY'],
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

// Handlers run in registration order, so everything above this line is public
// and everything below requires a token. The gate sits after the public routes
// (rather than path-scoped) so unknown paths also answer 401 instead of
// revealing which routes exist.
app.use('*', requireApiToken)

app.route('/api/auth', auth)

export const globalErrorHandler: ErrorHandler = (err, c) => {
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

  console.error('[UnhandledError]:', err)

  return c.json(
    {
      error: 'Internal Server Error',
    },
    500,
  )
}

app.onError(globalErrorHandler)

export default app
