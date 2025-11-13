'use client';

import React from 'react';
import { crashLogger } from '@/utils/crashLogger';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    crashLogger.log('error', 'React Error Boundary caught error', {
      error,
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-black text-white flex items-center justify-center z-[9999] p-8">
          <div className="max-w-2xl bg-red-900/90 rounded-lg p-6 border-2 border-red-500">
            <h1 className="text-2xl font-bold mb-4 text-red-400">⚠️ Application Error</h1>
            <p className="mb-4">Something went wrong. The error has been logged.</p>
            {this.state.error && (
              <div className="mb-4 p-4 bg-black/50 rounded text-sm font-mono overflow-auto max-h-64">
                <div className="text-red-400 font-bold mb-2">Error:</div>
                <div>{this.state.error.toString()}</div>
                {this.state.error.stack && (
                  <>
                    <div className="text-red-400 font-bold mt-4 mb-2">Stack:</div>
                    <div className="text-xs">{this.state.error.stack}</div>
                  </>
                )}
              </div>
            )}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                  window.location.reload();
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-semibold"
              >
                Reload Page
              </button>
              <button
                onClick={() => crashLogger.downloadLogs()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold"
              >
                Download Crash Logs
              </button>
              <button
                onClick={() => {
                  crashLogger.clearLogs();
                  this.setState({ hasError: false, error: null, errorInfo: null });
                  window.location.reload();
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white font-semibold"
              >
                Clear Logs & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}





