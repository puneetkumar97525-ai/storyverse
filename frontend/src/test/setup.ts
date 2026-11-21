/**
 * Vitest setup file (registered in vite.config.ts -> test.setupFiles).
 *
 * Adds jest-dom matchers (toBeInTheDocument, ...) and makes sure every test
 * starts from a clean DOM and un-stubbed global functions.
 */
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
