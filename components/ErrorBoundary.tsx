import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can log error info here if needed
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center text-red-700">
          <h2 className="text-2xl font-bold mb-4">Something went wrong.</h2>
          <pre className="bg-red-100 p-4 rounded">{this.state.error?.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
} 