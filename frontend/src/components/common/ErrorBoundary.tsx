import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    }

    private handleReload = () => {
        window.location.href = window.location.origin;
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 text-white font-sans">
                    <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl text-center animate-card-pop">
                        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-black mb-2 text-white">세션 보호 작동 중</h2>
                        <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                            예치 않은 오류가 발생하였으나 시스템 안전 보호막에 의해 세션이 보호되었습니다. 메인 메뉴로 복귀해 주세요.
                        </p>

                        {this.state.error && (
                            <div className="p-3 bg-gray-950 border border-gray-800 rounded-xl mb-6 text-left">
                                <p className="text-[11px] font-mono text-red-400 truncate">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}

                        <button
                            onClick={this.handleReload}
                            className="w-full py-3.5 bg-yellow-400 hover:bg-yellow-500 text-gray-950 font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
                        >
                            <Home className="w-4 h-4" /> 메인 메뉴로 복귀하기
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
