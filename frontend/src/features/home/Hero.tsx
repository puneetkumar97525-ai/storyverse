import { Badge } from '@/components/ui/Badge'

const STACK = ['React 19', 'TypeScript', 'Vite', 'FastAPI', 'PostgreSQL', 'Tailwind CSS'] as const

/** Above-the-fold introduction to the project and its current phase. */
export function Hero() {
  return (
    <section className="max-w-3xl space-y-6">
      <Badge tone="info">Phase 1 &middot; Project foundation</Badge>
      <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
        A foundation for stories that{' '}
        <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
          respond to you
        </span>
        .
      </h1>
      <p className="text-base leading-relaxed text-slate-300 sm:text-lg">
        StoryVerse is an interactive storytelling platform in the making. Phase 1 builds the
        scaffolding: a typed React frontend, a FastAPI backend, a PostgreSQL development database
        and the health checks, tests and documentation that keep them honest. No AI, no accounts
        yet &mdash; just a solid base to grow on.
      </p>
      <ul className="flex flex-wrap gap-2">
        {STACK.map((item) => (
          <li
            key={item}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}
