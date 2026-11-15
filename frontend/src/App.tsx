import { AppFooter } from '@/components/layout/AppFooter'
import { AppHeader } from '@/components/layout/AppHeader'
import { HomePage } from '@/pages/HomePage'

/**
 * Application shell: header, page content and footer.
 *
 * Phase 2 will add routing here (e.g. React Router) once there is more than
 * one page; a router would be an unused dependency today.
 */
export default function App() {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <HomePage />
      </main>
      <AppFooter />
    </div>
  )
}
