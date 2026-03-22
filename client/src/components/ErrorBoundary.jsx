import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    // Future integration: send to Sentry or another logging service here
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-6">
          <div className="max-w-xl w-full bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-4">Oops! Something went wrong.</h1>
            <p className="text-gray-400 mb-8">We apologize for the inconvenience. Our team has been notified and is working on the issue.</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => window.location.reload()} 
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                Refresh Page
              </button>
              <button 
                onClick={() => window.location.href = '/'} 
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Go to Homepage
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 text-left bg-gray-950 p-4 rounded-lg overflow-auto text-xs font-mono text-gray-400 border border-gray-700">
                <p className="text-red-400 font-bold mb-2">{this.state.error && this.state.error.toString()}</p>
                <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
