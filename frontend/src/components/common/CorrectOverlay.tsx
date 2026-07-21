import React from 'react';

interface CorrectOverlayProps {
    show: boolean;
}

export const CorrectOverlay: React.FC<CorrectOverlayProps> = ({ show }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
            <div className="flex flex-col items-center justify-center bg-gray-950/80 backdrop-blur-md px-12 py-8 rounded-3xl border-2 border-green-400 shadow-[0_0_50px_rgba(74,222,128,0.5)] animate-correct-pop">
                <span className="text-6xl mb-2">⭕</span>
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300 tracking-widest uppercase">
                    CORRECT!
                </span>
            </div>
        </div>
    );
};
