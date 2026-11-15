/**
 * Test helpers: fake backend payloads and a `fetch` stub.
 *
 * These mirror the real API shapes in `src/features/system/types.ts`, so tests
 * fail if the contract changes.
 */

import { vi } from 'vitest'

const TIMESTAMP = '2026-01-01T00:00:00Z'

export const apiHealthOk = {
  status: 'ok',
  service: 'StoryVerse API',
  version: '0.1.0',
  environment: 'test',
  timestamp: TIMESTAMP,
} as const

export const databaseHealthOk = {
  status: 'ok',
  database: 'postgresql',
  latency_ms: 2.4,
  detail: null,
  timestamp: TIMESTAMP,
} as const

export const databaseHealthUnavailable = {
  status: 'unavailable',
  database: 'postgresql',
  latency_ms: null,
  detail: 'OperationalError',
  timestamp: TIMESTAMP,
} as const

/** Build a JSON `Response`, like the real API would return. */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Replace `fetch` with a stub that returns the given responses in order.
 * Pass anything that is not a `Response` (an `Error`, a `DOMException`) to
 * simulate a thrown network/abort failure.
 */
export function mockFetch(...responses: Array<Response | Error | DOMException>) {
  const fetchMock = vi.fn()
  for (const response of responses) {
    if (response instanceof Response) {
      fetchMock.mockResolvedValueOnce(response)
    } else {
      fetchMock.mockRejectedValueOnce(response)
    }
  }
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}
