import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SystemStatusPanel } from '@/features/system/SystemStatusPanel'
import {
  apiHealthOk,
  databaseHealthOk,
  databaseHealthUnavailable,
  jsonResponse,
  mockFetch,
} from '@/test/mocks'

/** Find the status card whose title matches, then search inside it. */
function card(title: string): HTMLElement {
  const heading = screen.getByRole('heading', { name: title })
  const article = heading.closest('article')
  if (!article) throw new Error(`No card found for "${title}"`)
  return article
}

describe('SystemStatusPanel', () => {
  it('shows API and database as online when both checks pass', async () => {
    mockFetch(jsonResponse(apiHealthOk), jsonResponse(databaseHealthOk))

    render(<SystemStatusPanel />)

    await waitFor(() => {
      expect(within(card('Backend API')).getByText('Online')).toBeInTheDocument()
    })
    expect(within(card('Backend API')).getByText('Version 0.1.0 · test')).toBeInTheDocument()
    expect(within(card('Database')).getByText('Online')).toBeInTheDocument()
    expect(within(card('Database')).getByText('PostgreSQL · 2.40 ms')).toBeInTheDocument()
    expect(screen.getByText(/Checked at/)).toBeInTheDocument()
  })

  it('explains that only the database is down when the API is healthy', async () => {
    mockFetch(jsonResponse(apiHealthOk), jsonResponse(databaseHealthUnavailable, 503))

    render(<SystemStatusPanel />)

    await waitFor(() => {
      expect(within(card('Database')).getByText('Unavailable')).toBeInTheDocument()
    })
    expect(within(card('Backend API')).getByText('Online')).toBeInTheDocument()
    expect(within(card('Database')).getByText('OperationalError')).toBeInTheDocument()
    expect(screen.getByText(/PostgreSQL is not reachable/)).toBeInTheDocument()
  })

  it('reports the backend as unavailable when the request fails', async () => {
    mockFetch(new TypeError('Failed to fetch'))

    render(<SystemStatusPanel />)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/backend running/i)
    expect(within(card('Backend API')).getByText('Unavailable')).toBeInTheDocument()
    // Without an API answer the database state is unknown, not "offline".
    expect(within(card('Database')).getByText('Unknown')).toBeInTheDocument()
  })

  it('re-checks every endpoint when Refresh is clicked', async () => {
    const fetchMock = mockFetch(
      jsonResponse(apiHealthOk),
      jsonResponse(databaseHealthOk),
      jsonResponse(apiHealthOk),
      jsonResponse(databaseHealthOk),
    )

    render(<SystemStatusPanel />)
    await waitFor(() => {
      expect(within(card('Database')).getByText('Online')).toBeInTheDocument()
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)

    fireEvent.click(screen.getByRole('button', { name: /refresh/i }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4))
  })
})
