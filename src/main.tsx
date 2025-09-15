import { Component, ReactNode } from 'react';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Error boundary global para capturar erros que causam tela branca
class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error?: Error}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('🚨 Global Error Boundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 Error details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '400px',
            textAlign: 'center',
            padding: '2rem',
            border: '1px solid #e5e5e5',
            borderRadius: '8px',
            backgroundColor: '#fafafa'
          }}>
            <h1 style={{ color: '#ef4444', marginBottom: '1rem' }}>
              🚨 ERRO CRÍTICO
            </h1>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Erro: {this.state.error?.message || 'Desconhecido'}
            </p>
            <p style={{ color: '#888', fontSize: '12px', marginBottom: '1.5rem' }}>
              Platform: {navigator.platform} | UA: {navigator.userAgent.substring(0, 50)}...
            </p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              🔄 Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

console.log('🔥 DEBUGGING MODE - App starting');
console.log('Platform:', navigator.platform);
console.log('UserAgent:', navigator.userAgent);
console.log('MediaDevices support:', !!(navigator.mediaDevices?.getUserMedia));
console.log('MediaRecorder support:', typeof MediaRecorder !== 'undefined');

// Removendo StrictMode temporariamente para debug
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);