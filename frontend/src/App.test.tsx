import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the ARES branding in sidebar', () => {
    render(<App />)
    expect(screen.getAllByText('ARES').length).toBeGreaterThan(0)
  })

  it('renders sidebar navigation items', () => {
    render(<App />)
    expect(screen.getAllByText('Chat').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Voz').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Ajustes').length).toBeGreaterThan(0)
  })

  it('shows the chat view by default with empty state', () => {
    render(<App />)
    expect(screen.getByText(/Tu asistente de voz inteligente/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Escribe un mensaje...')).toBeInTheDocument()
  })

  it('switches to voice view and shows microphone', () => {
    render(<App />)
    fireEvent.click(screen.getAllByText('Voz')[0])
    expect(screen.getByRole('button', { name: /iniciar grabación/i })).toBeInTheDocument()
  })

  it('shows wake word prompt in voice view idle state', () => {
    render(<App />)
    fireEvent.click(screen.getAllByText('Voz')[0])
    expect(screen.getByText(/Despierta Ares/i)).toBeInTheDocument()
  })

  it('switches to settings view', () => {
    render(<App />)
    fireEvent.click(screen.getAllByText('Ajustes')[0])
    expect(screen.getByText('Idioma')).toBeInTheDocument()
    expect(screen.getByText('Acerca de')).toBeInTheDocument()
  })
})
