import { FoundationSection } from '@/features/home/FoundationSection'
import { Hero } from '@/features/home/Hero'
import { QuickStartSection } from '@/features/home/QuickStartSection'
import { RoadmapSection } from '@/features/home/RoadmapSection'
import { SystemStatusPanel } from '@/features/system/SystemStatusPanel'

/**
 * Phase 1 landing page: introduction, live system status, delivered scope,
 * roadmap and run instructions.
 */
export function HomePage() {
  return (
    <div className="space-y-16">
      <Hero />
      <SystemStatusPanel />
      <FoundationSection />
      <RoadmapSection />
      <QuickStartSection />
    </div>
  )
}
