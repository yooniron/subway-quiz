import React from 'react';

export interface CorrectOverlayProps {
    show?: boolean;
    isVisible?: boolean;
    points?: number | null;
    type?: 'correct' | 'wrong' | 'opponent';
    title?: string;
    message?: string;
}

export const CorrectOverlay: React.FC<CorrectOverlayProps> = ({
    show,
    isVisible,
    points,
    type = 'correct',
    title,
    message
}) => {
    const shouldShow = show ?? isVisible ?? false;

    if (!shouldShow) return null;

    const isWrong = type === 'wrong';
    const isOpponent = type === 'opponent';

    const icon = isWrong ? '❌' : isOpponent ? '⚡' : '⭕';
    const defaultTitle = isWrong ? 'INCORRECT!' : isOpponent ? 'OPPONENT SCORED!' : 'CORRECT!';
    const displayTitle = title || defaultTitle;

    const borderStyle = isWrong
        ? 'border-rose-500 animate-shake'
        : isOpponent
        ? 'border-amber-400 animate-bounce'
        : 'border-emerald-400 animate-card-pop';

    const gradientText = isWrong
        ? 'from-rose-400 via-red-500 to-pink-500'
        : isOpponent
        ? 'from-amber-300 via-orange-400 to-yellow-300'
        : 'from-emerald-400 via-green-300 to-teal-200';

    return (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center px-4">
            <div className={`flex flex-col items-center justify-center bg-gray-950/95 border-2 px-8 py-6 rounded-3xl shadow-xl transform-gpu ${borderStyle}`}>
                <span className="text-5xl mb-2 select-none">{icon}</span>
                <span className={`text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r ${gradientText} tracking-widest uppercase text-center`}>
                    {displayTitle}
                </span>
                {points !== null && points !== undefined && points > 0 && (
                    <span className="mt-1.5 text-lg font-black text-yellow-400 font-mono tracking-wider">
                        +{points} pts
                    </span>
                )}
                {message && (
                    <span className="mt-1 text-xs sm:text-sm font-bold text-gray-300 font-sans tracking-wide text-center">
                        {message}
                    </span>
                )}
            </div>
        </div>
    );
};
