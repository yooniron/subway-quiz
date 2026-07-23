import React, { Component, ErrorInfo, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md bg-gray-900 border border-gray-800 p-8 rounded-3xl shadow-2xl">
            <h1 className="text-2xl font-black text-red-400 mb-3">⚠️ 일시적 시스템 오류가 발생했습니다</h1>
            <p className="text-gray-400 text-sm mb-6">
              예기치 못한 런타임 예외로 인해 화면을 표시할 수 없습니다. 메인으로 복귀해 다시 시도해 주세요.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-950 font-bold rounded-xl transition-all shadow-lg active:scale-95"
            >
              🔄 메인 페이지로 새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
