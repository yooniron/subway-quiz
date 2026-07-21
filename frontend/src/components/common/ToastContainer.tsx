import React from 'react';
import { Award, AlertTriangle, Zap, CheckCircle2 } from 'lucide-react';
import type { Toast } from '../../types';

interface ToastContainerProps {
    toasts: Toast[];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
    return (
        <div className="fixed top-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md flex items-center gap-3 text-sm font-bold animate-bounce ${
                        toast.type === 'error'
                            ? 'bg-red-500/10 border-red-500/30 text-red-400'
                            : toast.type === 'score'
                            ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-300'
                            : toast.type === 'success'
                            ? 'bg-green-500/10 border-green-500/30 text-green-400'
                            : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                    }`}
                >
                    {toast.type === 'error' && <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />}
                    {toast.type === 'score' && <Award className="w-5 h-5 shrink-0 text-yellow-400" />}
                    {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 text-green-400" />}
                    {toast.type === 'info' && <Zap className="w-5 h-5 shrink-0 text-blue-400" />}
                    <span>{toast.message}</span>
                </div>
            ))}
        </div>
    );
};
