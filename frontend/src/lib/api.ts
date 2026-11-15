/**
 * Minimal typed HTTP client.
 *
 * Why not axios? `fetch` is built into browsers and Node, so this adds no
 * dependency. It centralises the things every request needs: the base URL,
 * a timeout, JSON parsing and a consistent error type.
 */

import { env } from '@/config/env'

const DEFAULT_TIMEOUT_MS = 8000

/** Any failed API call ends up as one of these. */
export class ApiError extends Error {
  /** HTTP status, or 0 when the request never reached the server. */
  readonly status: number
  /** Parsed response body when the server sent one (e.g. our error envelope). */
  readonly payload: unknown

  constructor(message: string, status: number, payload: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

export interface RequestOptions {
  signal?: AbortSignal | undefined
  timeoutMs?: number | undefined
}

interface ErrorEnvelope {
  error?: { code?: string; message?: string }
}

function buildUrl(path: string): string {
  return `${env.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

function isErrorEnvelope(payload: unknown): payload is ErrorEnvelope {
  return typeof payload === 'object' && payload !== null && 'error' in payload
}

function messageFromPayload(payload: unknown, fallback: string): string {
  if (isErrorEnvelope(payload)) {
    const message = payload.error?.message
    if (typeof message === 'string' && message.length > 0) return message
  }
  return fallback
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null
  const text = await response.text()
  if (text.length === 0) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

function isDomErrorNamed(error: unknown, name: string): boolean {
  return error instanceof DOMException && error.name === name
}

/**
 * Perform a GET request and return the parsed JSON body.
 *
 * @throws {ApiError} on a non-2xx response, a network failure or a timeout.
 * @throws {DOMException} with name `AbortError` when the caller aborted.
 */
export async function getJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const timeoutSignal = AbortSignal.timeout(timeoutMs)
  const signal = options.signal
    ? AbortSignal.any([timeoutSignal, options.signal])
    : timeoutSignal

  let response: Response
  try {
    response = await fetch(buildUrl(path), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    })
  } catch (error) {
    // Caller-initiated cancellation must stay distinguishable from failure.
    if (isDomErrorNamed(error, 'AbortError')) throw error
    if (isDomErrorNamed(error, 'TimeoutError')) {
      throw new ApiError('The API took too long to respond.', 0)
    }
    throw new ApiError('Could not reach the StoryVerse API. Is the backend running?', 0)
  }

  const payload = await parseBody(response)

  if (!response.ok) {
    throw new ApiError(
      messageFromPayload(payload, `Request failed with status ${response.status}.`),
      response.status,
      payload,
    )
  }

  return payload as T
}
