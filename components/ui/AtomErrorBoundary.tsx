'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  atomId: string;
  fallback?: ReactNode;
  onError?: (error: Error, atomId: string) => void;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

export class AtomErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { atomId, onError } = this.props;
    
    // Report to self-heal system
    this.reportError(error, errorInfo);
    
    // Call custom error handler
    onError?.(error, atomId);
  }

  async reportError(error: Error, errorInfo: React.ErrorInfo) {
    const { atomId } = this.props;
    
    try {
      await fetch('/api/self-heal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          atomId,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          retryCount: this.state.retryCount,
        }),
      });
    } catch {
      console.error('Failed to report error to self-heal system');
    }
  }

  handleRetry = () => {
    this.setState(prev => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  render() {
    const { hasError, error, retryCount } = this.state;
    const { atomId, fallback, children } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <div className="glass rounded-2xl p-6 border border-red-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <span className="text-red-400">⚠️</span>
            </div>
            <div>
              <h3 className="font-semibold text-red-400">
                {atomId} - Offline
              </h3>
              <p className="text-xs text-gray-500">
                Component error detected
              </p>
            </div>
          </div>
          
          {retryCount < 3 && (
            <button
              onClick={this.handleRetry}
              className="w-full py-2 px-4 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-red-400 text-sm font-medium transition"
            >
              🔄 Retry ({3 - retryCount} attempts left)
            </button>
          )}
          
          {retryCount >= 3 && (
            <div className="text-center text-sm text-gray-500">
              Auto-recovery in progress...
            </div>
          )}
          
          {process.env.NODE_ENV === 'development' && error && (
            <details className="mt-4 text-xs text-gray-600">
              <summary className="cursor-pointer">Error details</summary>
              <pre className="mt-2 p-2 bg-black/50 rounded overflow-auto">
                {error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return children;
  }
}

export default AtomErrorBoundary;
