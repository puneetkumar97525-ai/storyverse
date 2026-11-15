import { describe, expect, it } from 'vitest'

import { fetchApiHealth, fetchDatabaseHealth } from '@/features/system/api'
import {
  apiHealthOk,
  databaseHealthOk,
  databaseHealthUnavailable,
  jsonResponse,
  mockFetch,
} from '@/test/mocks'

describe('system api', () => {
  it('fetches API health from the versioned endpoint', async () => {
    const fetchMock = mockFetch(jsonResponse(apiHealthOk))

    await expect(fetchApiHealth()).resolves.toMatchObject({ status: 'ok', version: '0.1.0' })
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/health', expect.anything())
  })

  it('returns the database payload when PostgreSQL is healthy', async () => {
    mockFetch(jsonResponse(databaseHealthOk))

    await expect(fetchDatabaseHealth()).resolves.toMatchObject({
      status: 'ok',
      latency_ms: 2.4,
    })
  })

  it('treats a 503 response as a valid "database unavailable" answer', async () => {
    // The backend deliberately answers 503 when the database is down; that is
    // information the UI needs, not an error to swallow.
    mockFetch(jsonResponse(databaseHealthUnavailable, 503))

    await expect(fetchDatabaseHealth()).resolves.toMatchObject({
      status: 'unavailable',
      detail: 'OperationalError',
    })
  })

  it('still throws for other server errors', async () => {
    mockFetch(jsonResponse({ error: { code: 'internal_server_error', message: 'Boom' } }, 500))

    await expect(fetchDatabaseHealth()).rejects.toThrow('Boom')
  })
})
