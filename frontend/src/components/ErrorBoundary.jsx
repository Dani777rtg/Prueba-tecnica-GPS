import { Component } from 'react';

/** Catches render crashes so the SPA doesn't go blank */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('UI error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="login-page">
          <div className="login-card">
            <h1>Algo salió mal</h1>
            <p className="subtitle">Recarga la página para continuar.</p>
            <button type="button" className="btn-primary" onClick={() => window.location.assign('/')}>
              Recargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
