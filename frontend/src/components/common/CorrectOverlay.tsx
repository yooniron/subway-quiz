import React from 'react';

interface CorrectOverlayProps {
    show?: boolean;
    isVisible?: boolean;
    points?: number | null;
}

export const CorrectOverlay: React.FC<CorrectOverlayProps> = ({ show, isVisible, points }) => {
    const shouldShow = show ?? isVisible ?? false;

    if (!shouldShow) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
            <div className="flex flex-col items-center justify-center bg-gray-950/85 backdrop-blur-xl px-14 py-10 rounded-3xl border-2 border-emerald-400 shadow-[0_0_60px_rgba(52,211,153,0.6)] animate-correct-pop">
                <span className="text-7xl mb-2 animate-bounce">⭕</span>
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-teal-200 tracking-widest uppercase drop-shadow-md">
                    CORRECT!
                </span>
                {points !== null && points !== undefined && (
                    <span className="mt-2 text-2xl font-black text-yellow-400 font-mono tracking-wider drop-shadow-md animate-pulse">
                        +{points} pts
                    </span>
                )}
            </div>
        </div>
    );
};
