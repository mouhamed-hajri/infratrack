import { StrictMode, Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/fraunces'
import '@fontsource-variable/plus-jakarta-sans'
import './index.css'
import App from './App.tsx'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(e: Error) { return { error: e } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'monospace', color: '#A8321F', background: '#FAF6EF', minHeight: '100dvh' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>App crashed</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>{String(this.state.error)}</pre>
        </div>
      )
    }
    return this.state.error === null ? this.props.children : null
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
