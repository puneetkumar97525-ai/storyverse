import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from '@/App'
import { apiHealthOk, databaseHealthOk, jsonResponse, mockFetch } from '@/test/mocks'

describe('App', () => {
  it('renders the Phase 1 landing page and loads live status', async () => {
    mockFetch(jsonResponse(apiHealthOk), jsonResponse(databaseHealthOk))

    render(<App />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/respond to you/i)
    expect(screen.getByRole('heading', { name: /live system check/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /what phase 1 delivers/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /coming in later phases/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /run it locally/i })).toBeInTheDocument()

    // The live status card is filled from the (mocked) backend response.
    expect(await screen.findByText('Version 0.1.0 · test')).toBeInTheDocument()

    // Roadmap items must be presented as planned, not delivered.
    expect(screen.getByText(/AI-powered adaptive storytelling/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Phase 1/).length).toBeGreaterThan(0)
  })
})
