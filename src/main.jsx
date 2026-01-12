import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
/* import './index.css' */

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ info: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'sans-serif', color: '#111' }}>
          <h1 style={{ color: '#EF4444' }}>Ocorreu um erro na aplicação.</h1>
          <h3>Erro:</h3>
          <pre style={{ background: '#F3F4F6', padding: 20, borderRadius: 8, overflow: 'auto' }}>
            {this.state.error?.toString()}
          </pre>
          <h3>Detalhes:</h3>
          <pre style={{ background: '#F3F4F6', padding: 20, borderRadius: 8, overflow: 'auto' }}>
            {this.state.info?.componentStack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
