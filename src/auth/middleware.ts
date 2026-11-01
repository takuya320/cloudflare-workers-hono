import { createMiddleware } from 'hono/factory'
import { timingSafeEqual } from 'hono/utils/buffer'
import { ApiError } from '@/error/ApiError'

export type AuthEnv = {
  Bindings: {
    // "name:token" pairs separated by commas. Secret: `.dev.vars` locally, `wrangler secret put` when deployed.
    API_TOKENS?: string
  }
  Variables: {
    clientName: string
  }
}

type Client = { name: string; token: string }

const BEARER_PATTERN = /^Bearer +(\S+)$/i

// Split on the first colon only, so tokens may contain colons but names may not.
// Entries without a colon are dropped; slicing around indexOf() === -1 would
// otherwise turn "broken" into name "broke" with token "broken".
const parseClients = (raw: string): Client[] =>
  raw.split(',').flatMap((entry) => {
    const separator = entry.indexOf(':')
    if (separator < 0) return []
    const name = entry.slice(0, separator).trim()
    const token = entry.slice(separator + 1).trim()
    return name !== '' && token !== '' ? [{ name, token }] : []
  })

export const requireApiToken = createMiddleware<AuthEnv>(async (c, next) => {
  const clients = parseClients(c.env?.API_TOKENS ?? '')
  if (clients.length === 0) {
    // Fail closed: a missing secret must never turn into open access
    throw new ApiError(
      500,
      'Internal Server Error',
      'API_TOKENS is not configured',
    )
  }

  const presented = BEARER_PATTERN.exec(
    c.req.header('Authorization') ?? '',
  )?.[1]

  let clientName: string | undefined
  if (presented) {
    // Check every client even after a match so timing does not reveal which entry matched
    for (const client of clients) {
      if (await timingSafeEqual(client.token, presented)) {
        clientName ??= client.name
      }
    }
  }

  if (!clientName) {
    c.header('WWW-Authenticate', 'Bearer')
    throw new ApiError(
      401,
      'Unauthorized',
      presented ? 'Bearer token did not match' : 'Bearer token is missing',
    )
  }

  c.set('clientName', clientName)
  await next()
})
