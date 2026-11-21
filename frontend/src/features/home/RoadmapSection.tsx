import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'

import { ROADMAP } from '@/data/roadmap'

/** The planned features, clearly marked as not built yet. */
export function RoadmapSection() {
  return (
    <section aria-labelledby="roadmap-heading" className="space-y-4">
      <div>
        <h2 id="roadmap-heading" className="text-lg font-semibold text-white">
          Coming in later phases
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Planned features. None of these are implemented yet &mdash; the cards exist so the
          foundation can be designed around them.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ROADMAP.map((item) => (
          <Card key={item.title} as="article" className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <span aria-hidden="true" className="text-2xl">
                {item.icon}
              </span>
              <Badge tone="neutral">{item.phase}</Badge>
            </div>
            <h3 className="text-sm font-semibold text-white">{item.title}</h3>
            <p className="text-xs leading-relaxed text-slate-400">{item.description}</p>
          </Card>
        ))}
      </div>
    </section>
  )
}
