/** Footer with the stack summary and the MIT licence notice. */
export function AppFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          StoryVerse &mdash; React + TypeScript + Vite &middot; FastAPI &middot; PostgreSQL
        </p>
        <p>
          Phase 1 deliverable &middot; MIT licence &middot;{' '}
          <span className="text-slate-500">No AI or auth features yet</span>
        </p>
      </div>
    </footer>
  )
}
