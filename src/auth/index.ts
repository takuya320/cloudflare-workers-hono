import { Hono } from 'hono'
import type { AuthEnv } from './middleware'

const auth = new Hono<AuthEnv>()

// GET /me - Report which client the bearer token belongs to
auth.get('/me', (c) => {
  return c.json({ clientName: c.get('clientName') })
})

export default auth
