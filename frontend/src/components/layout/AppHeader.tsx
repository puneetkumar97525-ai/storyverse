import { Badge } from '@/components/ui/Badge'

/** Sticky top bar with the product name and the current project phase. */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-400 to-fuchsia-400 text-lg font-black text-slate-950">
            S
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight text-white">StoryVerse</p>
            <p className="text-xs text-slate-400">Interactive storytelling platform</p>
          </div>
        </div>
        <Badge tone="info">Phase 1 &middot; Foundation</Badge>
      </div>
    </header>
  )
}
