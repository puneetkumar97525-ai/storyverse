import type { CheckState } from '@/features/system/useSystemHealth'

const DOT_CLASSES: Record<CheckState, string> = {
  online: 'bg-emerald-400 shadow-[0_0_10px_2px_rgba(52,211,153,0.6)]',
  offline: 'bg-rose-400 shadow-[0_0_10px_2px_rgba(251,113,133,0.6)]',
  checking: 'animate-pulse bg-amber-300',
  unknown: 'bg-slate-500',
}

interface StatusDotProps {
  state: CheckState
  className?: string
}

/** Coloured dot that conveys a connection state at a glance. */
export function StatusDot({ state, className = '' }: StatusDotProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-2.5 shrink-0 rounded-full ${DOT_CLASSES[state]} ${className}`}
    />
  )
}
