import type { StatusCode } from 'hono/utils/http-status'

export class ApiError extends Error {
  public statusCode: StatusCode
  public clientMessage: string
  public internalMessage?: string

  constructor(
    statusCode: StatusCode,
    clientMessage: string,
    internalMessage?: string,
  ) {
    super(internalMessage || clientMessage)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.clientMessage = clientMessage
    this.internalMessage = internalMessage

    // Maintaining proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }
  }
}
