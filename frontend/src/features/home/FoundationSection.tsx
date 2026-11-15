import { Card } from '@/components/ui/Card'

import { FOUNDATION_PILLARS } from '@/data/roadmap'

/** Lists what Phase 1 delivered, so the scope is explicit. */
export function FoundationSection() {
  return (
    <section aria-labelledby="foundation-heading" className="space-y-4">
      <div>
        <h2 id="foundation-heading" className="text-lg font-semibold text-white">
          What Phase 1 delivers
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Everything below is implemented, tested and documented in this repository.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FOUNDATION_PILLARS.map((pillar) => (
          <Card key={pillar.title} as="article" className="flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <span aria-hidden="true" className="mt-0.5 text-emerald-400">
                ✓
              </span>
              <h3 className="text-sm font-semibold text-white">{pillar.title}</h3>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">{pillar.description}</p>
          </Card>
        ))}
      </div>
    </section>
  )
}
