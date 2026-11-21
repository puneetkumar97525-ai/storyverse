/**
 * API calls for the health/status feature.
 *
 * Components and hooks never call `fetch` directly - they use these functions,
 * which know the endpoints and how to interpret their responses.
 */

import { ApiError, getJson } from '@/lib/api'

import type { DatabaseHealthResponse, HealthResponse } from './types'

/** Liveness of the FastAPI process (`GET /api/v1/health`). */
export function fetchApiHealth(signal?: AbortSignal | undefined): Promise<HealthResponse> {
  return getJson<HealthResponse>('/health', { signal })
}

function isDatabaseHealthResponse(value: unknown): value is DatabaseHealthResponse {
  if (typeof value !== 'object' || value === null) return false
  const status = (value as { status?: unknown }).status
  return status === 'ok' || status === 'unavailable'
}

/**
 * PostgreSQL connectivity (`GET /api/v1/health/db`).
 *
 * The backend answers 503 when the database is down. That is a legitimate
 * answer rather than a bug, so the parsed body is returned instead of throwing
 * - the UI can then show "unavailable" with the reason.
 */
export async function fetchDatabaseHealth(
  signal?: AbortSignal | undefined,
): Promise<DatabaseHealthResponse> {
  try {
    return await getJson<DatabaseHealthResponse>('/health/db', { signal })
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 503 &&
      isDatabaseHealthResponse(error.payload)
    ) {
      return error.payload
    }
    throw error
  }
}
