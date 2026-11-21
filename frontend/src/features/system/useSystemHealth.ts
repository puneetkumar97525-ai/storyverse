/**
 * Polls the backend health endpoints and exposes a simple view of the system.
 *
 * The hook owns the loading/error bookkeeping so components stay declarative,
 * and it cancels in-flight requests on unmount to avoid state updates after
 * the component is gone.
 */

import { useCallback, useEffect, useState } from 'react'

import { fetchApiHealth, fetchDatabaseHealth } from './api'

export type CheckState = 'checking' | 'online' | 'offline' | 'unknown'

interface HealthState {
  api: CheckState
  database: CheckState
  apiVersion: string | null
  environment: string | null
  databaseLatencyMs: number | null
  databaseDetail: string | null
  error: string | null
  lastCheckedAt: Date | null
}

export interface SystemHealth extends HealthState {
  /** Trigger an immediate re-check. */
  refresh: () => void
}

const DEFAULT_POLL_INTERVAL_MS = 30_000

const INITIAL_STATE: HealthState = {
  api: 'checking',
  database: 'checking',
  apiVersion: null,
  environment: null,
  databaseLatencyMs: null,
  databaseDetail: null,
  error: null,
  lastCheckedAt: null,
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error'
}

export function useSystemHealth(pollIntervalMs: number = DEFAULT_POLL_INTERVAL_MS): SystemHealth {
  const [state, setState] = useState<HealthState>(INITIAL_STATE)
  const [refreshToken, setRefreshToken] = useState(0)

  const refresh = useCallback(() => {
    setRefreshToken((token) => token + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    async function check(): Promise<void> {
      setState((previous) => ({
        ...previous,
        api: 'checking',
        database: 'checking',
        error: null,
      }))

      let health
      try {
        health = await fetchApiHealth(controller.signal)
      } catch (error) {
        if (cancelled || isAbortError(error)) return
        setState({
          ...INITIAL_STATE,
          api: 'offline',
          database: 'unknown',
          error: errorMessage(error),
          lastCheckedAt: new Date(),
        })
        return
      }

      if (cancelled) return

      setState({
        ...INITIAL_STATE,
        api: 'online',
        database: 'checking',
        apiVersion: health.version,
        environment: health.environment,
        lastCheckedAt: new Date(),
      })

      try {
        const database = await fetchDatabaseHealth(controller.signal)
        if (cancelled) return
        setState((previous) => ({
          ...previous,
          database: database.status === 'ok' ? 'online' : 'offline',
          databaseLatencyMs: database.latency_ms,
          databaseDetail: database.detail,
          lastCheckedAt: new Date(),
        }))
      } catch (error) {
        if (cancelled || isAbortError(error)) return
        setState((previous) => ({
          ...previous,
          database: 'unknown',
          databaseDetail: errorMessage(error),
          lastCheckedAt: new Date(),
        }))
      }
    }

    void check()
    const timer = setInterval(() => {
      void check()
    }, pollIntervalMs)

    return () => {
      cancelled = true
      clearInterval(timer)
      controller.abort()
    }
  }, [pollIntervalMs, refreshToken])

  return { ...state, refresh }
}
