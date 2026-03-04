// Global error boundary — catches JavaScript errors in the React component tree.
// Prevents a white screen of death by showing a fallback UI.
// Must NOT contain business logic or API calls.
import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // In production, send this to an error tracking service (Sentry, etc.)
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#F4F6F8] p-6">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Something went wrong
            </h2>
            <p className="mb-6 text-sm text-slate-500">
              An unexpected error occurred. Please try reloading the page.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="rounded-full bg-[#0052FF] px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

