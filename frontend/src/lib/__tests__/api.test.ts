import { describe, expect, it } from 'vitest'

import { ApiError, getJson } from '@/lib/api'
import { jsonResponse, mockFetch } from '@/test/mocks'

describe('getJson', () => {
  it('returns the parsed JSON body for a successful request', async () => {
    const fetchMock = mockFetch(jsonResponse({ status: 'ok' }))

    await expect(getJson('/health')).resolves.toEqual({ status: 'ok' })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/health',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('throws an ApiError carrying status and the backend error code', async () => {
    mockFetch(jsonResponse({ error: { code: 'not_found', message: 'Not Found' } }, 404))

    const error = await getJson('/missing').catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 404, message: 'Not Found' })
  })

  it('falls back to a generic message when the error body is not JSON', async () => {
    mockFetch(new Response('gateway exploded', { status: 502 }))

    await expect(getJson('/broken')).rejects.toThrow('Request failed with status 502.')
  })

  it('wraps network failures in an ApiError with status 0', async () => {
    mockFetch(new TypeError('Failed to fetch'))

    const error = await getJson('/health').catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 0 })
    expect((error as ApiError).message).toMatch(/backend running/i)
  })

  it('returns null for an empty 204 response', async () => {
    mockFetch(new Response(null, { status: 204 }))

    await expect(getJson('/health')).resolves.toBeNull()
  })

  it('re-throws abort errors so callers can ignore cancellations', async () => {
    const abortError = new DOMException('The operation was aborted.', 'AbortError')
    mockFetch(abortError)

    await expect(getJson('/health')).rejects.toBe(abortError)
  })
})
