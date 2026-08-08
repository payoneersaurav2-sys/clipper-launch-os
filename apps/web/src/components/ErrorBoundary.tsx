import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to monitoring (future: Sentry, etc.)
    console.error('[Creator OS Error Boundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen bg-[#080808] flex items-center justify-center p-6 font-sans">
          <div className="flex flex-col items-center text-center max-w-md">
            <div className="h-16 w-16 rounded-[20px] bg-red-400/10 flex items-center justify-center mb-6">
              <AlertTriangle className="h-7 w-7 text-red-400" />
            </div>
            <h1 className="text-[24px] font-semibold text-[#FAFAFA] mb-3 tracking-tight">Something went wrong</h1>
            <p className="text-[14px] text-[#71717A] mb-2 leading-relaxed">
              An unexpected error occurred. This has been logged automatically.
            </p>
            <div className="flex gap-3">
              <button onClick={() => this.setState({ hasError: false })}
                className="flex items-center gap-2 h-10 px-5 rounded-[12px] bg-[#111111] border border-white/[0.08] text-[#A1A1AA] hover:text-[#FAFAFA] text-[13px] transition-colors">
                <RefreshCw className="h-4 w-4" />Try Again
              </button>
              <a href="/dashboard"
                className="flex items-center gap-2 h-10 px-5 rounded-[12px] bg-primary text-white hover:bg-primary/90 text-[13px] transition-colors">
                <Home className="h-4 w-4" />Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Route-level boundary (lighter)
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertTriangle className="h-8 w-8 text-red-400 mb-4" />
          <p className="text-[15px] font-medium text-[#FAFAFA] mb-2">Failed to load this page</p>
          <button onClick={() => window.location.reload()}
            className="text-[13px] text-primary hover:underline">
            Reload page
          </button>
        </div>
      }>
      {children}
    </ErrorBoundary>
  );
}
