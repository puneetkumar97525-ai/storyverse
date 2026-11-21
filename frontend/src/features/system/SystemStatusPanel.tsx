/**
 * Live proof that the frontend and backend can talk to each other.
 *
 * It calls the real `/api/v1/health` and `/api/v1/health/db` endpoints through
 * the Vite proxy and renders the result. Nothing here is simulated.
 */

import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { StatusDot } from '@/components/ui/StatusDot'

import { useSystemHealth, type CheckState } from './useSystemHealth'

const STATE_LABEL: Record<CheckState, string> = {
  online: 'Online',
  offline: 'Unavailable',
  checking: 'Checking',
  unknown: 'Unknown',
}

const STATE_TONE: Record<CheckState, BadgeTone> = {
  online: 'success',
  offline: 'danger',
  checking: 'warning',
  unknown: 'neutral',
}

interface StatusCardProps {
  label: string
  state: CheckState
  description: string
  detail: string | null
}

function StatusCard({ label, state, description, detail }: StatusCardProps) {
  return (
    <Card as="article" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">{label}</h3>
        <Badge tone={STATE_TONE[state]}>
          <StatusDot state={state} />
          {STATE_LABEL[state]}
        </Badge>
      </div>
      <p className="text-xs leading-relaxed text-slate-400">{description}</p>
      {detail ? <p className="font-mono text-xs text-slate-500">{detail}</p> : null}
    </Card>
  )
}

export function SystemStatusPanel() {
  const health = useSystemHealth()

  const apiDetail = health.apiVersion
    ? `Version ${health.apiVersion} · ${health.environment ?? 'unknown'}`
    : '/api/v1/health'

  return (
    <section aria-labelledby="system-status-heading" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="system-status-heading" className="text-lg font-semibold text-white">
            Live system check
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Real calls to the FastAPI health endpoints, proxied by Vite to{' '}
            <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs">/api/v1</code>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500" aria-live="polite">
            {health.lastCheckedAt
              ? `Checked at ${health.lastCheckedAt.toLocaleTimeString()}`
              : 'Waiting for first check…'}
          </span>
          <button
            type="button"
            onClick={health.refresh}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-indigo-400/40 hover:bg-indigo-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatusCard
          label="Frontend"
          state="online"
          description="This React app is running and rendering."
          detail="React 19 · Vite · TypeScript"
        />
        <StatusCard
          label="Backend API"
          state={health.api}
          description="FastAPI liveness probe (no database required)."
          detail={apiDetail}
        />
        <StatusCard
          label="Database"
          state={health.database}
          description="PostgreSQL reachability via the API's SELECT 1 check."
          detail={
            health.databaseLatencyMs !== null
              ? `PostgreSQL · ${health.databaseLatencyMs.toFixed(2)} ms`
              : health.databaseDetail
          }
        />
      </div>

      {health.error ? (
        <p
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
        >
          {health.error}
        </p>
      ) : null}

      {health.api === 'online' && health.database !== 'online' ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          The API is up but PostgreSQL is not reachable. Start it with{' '}
          <code className="font-mono">docker compose up -d db</code> and refresh.
        </p>
      ) : null}
    </section>
  )
}
