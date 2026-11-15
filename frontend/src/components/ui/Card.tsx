import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  /** Renders a semantic <article> instead of a plain <div>. */
  as?: 'div' | 'article' | 'section'
}

/** Frosted panel used for every block of content. */
export function Card({ children, className = '', as: Tag = 'div' }: CardProps) {
  return (
    <Tag
      className={`rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-lg shadow-slate-950/40 backdrop-blur ${className}`}
    >
      {children}
    </Tag>
  )
}
