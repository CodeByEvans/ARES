import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="h-full w-full flex flex-col items-center justify-center gap-6 px-8 text-center"
          style={{ background: 'var(--app-bg)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--app-surface)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="var(--app-state-error)" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--app-ink)' }}>
              Algo salió mal
            </h2>
            <p className="text-sm" style={{ color: 'var(--app-muted)', maxWidth: 280 }}>
              Ocurrió un error inesperado. Recarga la página para intentarlo de nuevo.
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="px-5 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-colors"
            style={{
              background: 'var(--app-primary)',
              color: 'var(--app-primary-text)',
            }}
          >
            Reintentar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
