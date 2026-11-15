/**
 * Single place where runtime configuration is read.
 *
 * Components never touch `import.meta.env` directly - they import `env`.
 * That keeps configuration testable and documents every available variable.
 */

const DEFAULT_API_BASE_URL = '/api/v1'

function readApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim()
  const baseUrl = configured && configured.length > 0 ? configured : DEFAULT_API_BASE_URL
  // Normalise: no trailing slash, so request paths always start with one.
  return baseUrl.replace(/\/+$/, '')
}

export const env = {
  /**
   * Default `/api/v1` is relative on purpose: the Vite dev server proxies it to
   * FastAPI, and a reverse proxy does the same thing in production.
   */
  apiBaseUrl: readApiBaseUrl(),
  isDevelopment: import.meta.env.DEV,
} as const
