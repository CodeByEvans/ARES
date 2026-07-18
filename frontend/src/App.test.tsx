import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders without crashing', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getAllByText(/ARES/).length).toBeGreaterThan(0)
    })
  })
})
