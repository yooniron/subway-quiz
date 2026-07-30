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
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center animate-fade-in">
            <div className="flex flex-col items-center justify-center bg-gray-950/90 border-2 border-emerald-400 px-8 py-6 rounded-2xl shadow-xl transform-gpu">
                <span className="text-5xl mb-1">⭕</span>
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-teal-200 tracking-widest uppercase">
                    CORRECT!
                </span>
                {points !== null && points !== undefined && (
                    <span className="mt-1 text-lg font-black text-yellow-400 font-mono tracking-wider">
                        +{points} pts
                    </span>
                )}
            </div>
        </div>
    );
};
