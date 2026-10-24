"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * Props accepted by the error boundary.
 */
interface AppErrorBoundaryProps {
  /** Content rendered inside the boundary. */
  children: ReactNode;
  /** Optional label shown in the recovery panel. */
  label?: string;
}

/**
 * State tracked by the error boundary.
 */
interface AppErrorBoundaryState {
  /** The caught error, or null when the tree renders normally. */
  error: Error | null;
}

/**
 * Runtime error boundary that keeps a white screen or a raw stack trace away from operators.
 *
 * It catches rendering, RPC and WebAssembly prover failures and offers a retry action together
 * with a route back to the landing page.
 */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  /**
   * Initial state with no captured error.
   */
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  /**
   * Captures the error so the recovery panel can describe it.
   *
   * @param error The thrown error.
   * @returns The next state.
   */
  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  /**
   * Reports the failure to the browser console for diagnosis.
   *
   * @param error The thrown error.
   * @param info React component stack information.
   */
  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Vane runtime failure", error, info.componentStack);
  }

  /**
   * Clears the captured error and renders the children again.
   */
  handleRetry = (): void => {
    this.setState({ error: null });
  };

  /**
   * Renders the recovery panel when an error was captured.
   *
   * @returns The rendered boundary content.
   */
  render(): ReactNode {
    const { error } = this.state;
    const { children, label } = this.props;

    if (!error) {
      return children;
    }

    return (
      <div className="w-full max-w-2xl mx-auto px-4 md:px-8 py-24">
        <div className="p-1.5 rounded-2xl bg-white/[0.04] ring-1 ring-[var(--border-default)]">
          <div className="rounded-[10px] bg-[var(--bg-secondary)] p-6 md:p-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--error)] mb-3">
              {label ?? "Runtime recovery"}
            </p>
            <h2 className="font-display text-2xl md:text-3xl font-bold uppercase text-[var(--text-primary)]">
              The console hit an unexpected fault
            </h2>
            <p className="mt-3 font-body text-sm text-[var(--text-secondary)] leading-relaxed">
              {error.message || "The operation did not complete. Retry the action to continue."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={this.handleRetry}
                className="group inline-flex items-center gap-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[#0a0b0d] pl-5 pr-4 py-2.5 rounded-full font-mono text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                Retry action
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/";
                }}
                className="inline-flex items-center gap-2 border border-[var(--border-default)] hover:border-[var(--accent)] bg-[var(--bg-surface)]/80 text-[var(--text-primary)] px-5 py-2.5 rounded-full font-mono text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-150"
              >
                Return to landing page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
