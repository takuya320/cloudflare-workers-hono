import { Hono } from 'hono'
import test from './test'

const app = new Hono()

app.get('/', (c) => {
  return c.json({ message: 'Hello, World!' })
})

app.route('/api/test', test)

export default app
