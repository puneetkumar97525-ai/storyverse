/// <reference types="vite/client" />

/**
 * Typed environment variables.
 *
 * Add every VITE_* variable here so `import.meta.env.VITE_FOO` is checked by
 * TypeScript instead of silently being `undefined` (or a typo).
 */
interface ImportMetaEnv {
  /** Base URL of the API, e.g. "/api/v1" (proxied) or "http://localhost:8000/api/v1". */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
