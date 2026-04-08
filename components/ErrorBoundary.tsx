'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error) {
            const rawError = parsed.error.toLowerCase();
            if (rawError.includes('permission') || rawError.includes('insufficient')) {
              errorMessage = "You don't have permission to perform this action. Please check your account privileges.";
            } else if (rawError.includes('offline') || rawError.includes('network')) {
              errorMessage = "It looks like you're offline or having network issues. Please check your connection.";
            } else if (rawError.includes('not-found')) {
              errorMessage = "The requested information could not be found. It might have been deleted.";
            } else {
              errorMessage = `A database error occurred: ${parsed.error}`;
            }
            
            // Add operation context if available
            if (parsed.operationType) {
              const opMap: Record<string, string> = {
                'create': 'creating data',
                'update': 'updating data',
                'delete': 'deleting data',
                'list': 'loading the list',
                'get': 'fetching details',
                'write': 'saving changes'
              };
              const opLabel = opMap[parsed.operationType] || parsed.operationType;
              errorMessage += ` (Error while ${opLabel})`;
            }
          }
        }
      } catch {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-rose-100">
            <h2 className="text-2xl font-bold text-rose-600 mb-4">System Error</h2>
            <p className="text-slate-600 mb-6">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
