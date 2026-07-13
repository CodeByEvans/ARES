import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import VoiceIndicator from './VoiceIndicator'

vi.mock('gsap', () => {
  const timeline = {
    to: vi.fn().mockReturnThis(),
    kill: vi.fn(),
  }
  return {
    default: {
      timeline: () => timeline,
      set: vi.fn(),
      to: vi.fn(),
      fromTo: vi.fn(),
    },
  }
})

describe('VoiceIndicator', () => {
  it('shows idle label when state is idle', () => {
    render(<VoiceIndicator state="idle" />)
    expect(screen.getByText(/Despierta Ares/i)).toBeInTheDocument()
  })

  it('shows listening label when state is listening', () => {
    render(<VoiceIndicator state="listening" />)
    expect(screen.getByText('Escuchando...')).toBeInTheDocument()
  })

  it('shows thinking label when state is thinking', () => {
    render(<VoiceIndicator state="thinking" />)
    expect(screen.getByText('Procesando...')).toBeInTheDocument()
  })

  it('shows speaking label when state is speaking', () => {
    render(<VoiceIndicator state="speaking" />)
    expect(screen.getByText('Respondiendo...')).toBeInTheDocument()
  })

  it('renders 8 audio bars', () => {
    const { container } = render(<VoiceIndicator state="idle" />)
    const bars = container.querySelectorAll('.w-1\\.5')
    expect(bars).toHaveLength(8)
  })
})
