/**
 * Types mirroring the backend response schemas in
 * `backend/app/schemas/health.py`.
 *
 * Keep them in sync when the API changes. A future improvement is generating
 * these from the FastAPI OpenAPI schema.
 */

export interface HealthResponse {
  status: 'ok'
  service: string
  version: string
  environment: string
  /** ISO 8601 UTC timestamp. */
  timestamp: string
}

export interface DatabaseHealthResponse {
  status: 'ok' | 'unavailable'
  database: 'postgresql'
  latency_ms: number | null
  detail: string | null
  timestamp: string
}
