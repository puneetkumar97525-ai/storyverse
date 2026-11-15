/**
 * Static copy describing what StoryVerse will become.
 *
 * The phases are a proposal, not a promise: adjust them as the project grows.
 * Keeping this text in one module keeps the page components about layout.
 */

export interface RoadmapItem {
  icon: string
  title: string
  description: string
  phase: string
}

export const ROADMAP: readonly RoadmapItem[] = [
  {
    icon: '✨',
    title: 'AI-powered adaptive storytelling',
    description:
      'Stories that react to the reader: tone, difficulty and plot threads adjust as the story unfolds.',
    phase: 'Phase 2',
  },
  {
    icon: '🔀',
    title: 'Branching choices & multiple endings',
    description:
      'A story graph where every choice leads somewhere, and endings are earned rather than stumbled upon.',
    phase: 'Phase 2',
  },
  {
    icon: '🎙️',
    title: 'Voice interaction & narration',
    description:
      'Speak your choices and hear the story read aloud, with narration that matches each scene.',
    phase: 'Phase 3',
  },
  {
    icon: '🌍',
    title: 'Multilingual storytelling',
    description:
      'Read and write stories in many languages, with translations that keep the original voice.',
    phase: 'Phase 3',
  },
  {
    icon: '🎨',
    title: 'Drawing & creative studio',
    description:
      'Illustrate scenes, design characters and save artwork alongside the stories that inspired it.',
    phase: 'Phase 4',
  },
  {
    icon: '🏆',
    title: 'Quizzes, achievements & progress',
    description:
      'Educational quizzes, unlockable badges and progress tracking for readers and learners.',
    phase: 'Phase 4',
  },
  {
    icon: '📚',
    title: 'Accounts & personal library',
    description:
      'Sign in, keep your own bookshelf of stories, pick up where you left off on any device.',
    phase: 'Phase 5',
  },
]

export interface FoundationPillar {
  title: string
  description: string
}

export const FOUNDATION_PILLARS: readonly FoundationPillar[] = [
  {
    title: 'React + TypeScript + Vite frontend',
    description:
      'Strict TypeScript, path aliases, Tailwind design system and Vitest tests that run in jsdom.',
  },
  {
    title: 'Python + FastAPI backend',
    description:
      'App factory, versioned /api/v1 routes, typed Pydantic responses and Pytest coverage.',
  },
  {
    title: 'PostgreSQL development setup',
    description:
      'SQLAlchemy 2 engine + session factory, Alembic migrations and a Docker Compose database.',
  },
  {
    title: 'Health checks that mean something',
    description:
      'Liveness, database and readiness probes, wired into the UI so failures are visible.',
  },
  {
    title: 'Configuration without secrets',
    description:
      'Every setting comes from environment variables; .env.example documents them, .env stays local.',
  },
  {
    title: 'Documentation & conventions',
    description:
      'Beginner-friendly setup guide, architecture notes and a README that explains every folder.',
  },
]
