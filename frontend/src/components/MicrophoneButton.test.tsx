import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MicrophoneButton from './MicrophoneButton'

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

describe('MicrophoneButton', () => {
  it('renders a button', () => {
    render(<MicrophoneButton state="idle" onClick={() => {}} />)
    expect(screen.getByRole('button', { name: /iniciar/i })).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<MicrophoneButton state="idle" onClick={onClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('shows correct label when listening', () => {
    render(<MicrophoneButton state="listening" onClick={() => {}} />)
    expect(screen.getByRole('button', { name: /detener/i })).toBeInTheDocument()
  })

  it('is disabled when disabled prop is true', () => {
    render(<MicrophoneButton state="idle" onClick={() => {}} disabled={true} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
