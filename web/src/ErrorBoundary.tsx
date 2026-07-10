import React from 'react';
interface Props { children: React.ReactNode; }
interface State { hasError: boolean; error: Error | null; }
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) { console.error('React Error:', error); console.error('Error Info:', errorInfo); }
  render() {
    if (this.state.hasError) {
      return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '20px' }}><div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}><h2 style={{ color: '#dc2626' }}>Something went wrong</h2><p style={{ color: '#666' }}>The application encountered an error.</p><p style={{ fontSize: '14px', color: '#999' }}>{this.state.error?.message || 'Unknown error'}</p><button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Reload Page</button></div></div>;
    }
    return this.props.children;
  }
}
export default ErrorBoundary;
