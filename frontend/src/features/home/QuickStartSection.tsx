import { Card } from '@/components/ui/Card'

const BACKEND_COMMANDS = `cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\\Scripts\\activate
pip install -r requirements-dev.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000`

const FRONTEND_COMMANDS = `cd frontend
npm install
cp .env.example .env.local
npm run dev`

/** Copy-paste starting point for a new developer. */
export function QuickStartSection() {
  return (
    <section aria-labelledby="quickstart-heading" className="space-y-4">
      <div>
        <h2 id="quickstart-heading" className="text-lg font-semibold text-white">
          Run it locally
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Two terminals, PostgreSQL optional for Phase 1 (the database card simply reports it as
          unavailable). Full instructions live in{' '}
          <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs">docs/getting-started.md</code>.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <h3 className="text-sm font-semibold text-white">1. Backend (port 8000)</h3>
          <pre className="overflow-x-auto rounded-xl bg-slate-950/80 p-4 font-mono text-xs leading-relaxed text-slate-300">
            <code>{BACKEND_COMMANDS}</code>
          </pre>
        </Card>
        <Card className="space-y-3">
          <h3 className="text-sm font-semibold text-white">2. Frontend (port 5173)</h3>
          <pre className="overflow-x-auto rounded-xl bg-slate-950/80 p-4 font-mono text-xs leading-relaxed text-slate-300">
            <code>{FRONTEND_COMMANDS}</code>
          </pre>
        </Card>
      </div>
    </section>
  )
}
