import React from 'react';
import { Flame } from 'lucide-react';
import { FloatingPoints } from '../common/FloatingPoints';

interface SingleScoreBoardProps {
    score: number;
    timeLeft: number;
    comboCount: number;
    floatingPoints: number | null;
    isShaking: boolean;
    onExit: () => void;
}

export const SingleScoreBoard: React.FC<SingleScoreBoardProps> = ({
    score,
    timeLeft,
    comboCount,
    floatingPoints,
    isShaking,
    onExit: _onExit
}) => {
    return (
        <div className={`flex gap-2 sm:gap-6 w-full max-w-2xl justify-between bg-gray-900/80 border border-gray-800 p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-2xl backdrop-blur-md relative overflow-hidden transition-transform duration-300 mb-4 sm:mb-6 ${
            isShaking ? 'animate-shake border-red-500/50' : ''
        }`}>
            <div className="text-center flex-1 relative min-w-0">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">MY SCORE</p>
                <p className="text-2xl sm:text-3xl font-black font-mono mt-0.5 text-white truncate">
                    {score}
                </p>
                <FloatingPoints points={floatingPoints} />
            </div>

            <div className="flex flex-col items-center justify-center border-x border-gray-800/80 px-2 sm:px-6 shrink-0">
                <span className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-black flex items-center gap-1 transition-all whitespace-nowrap ${
                    comboCount >= 10 
                        ? 'bg-gradient-to-r from-red-500 to-amber-500 text-white animate-bounce shadow-lg shadow-red-500/30'
                        : comboCount >= 5
                        ? 'bg-yellow-400 text-gray-950 shadow-md'
                        : comboCount >= 3
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-800 text-gray-500'
                }`}>
                    <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current shrink-0" />
                    {comboCount} COMBO
                </span>
            </div>

            <div className="text-center flex-1 min-w-0">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">TIME LEFT</p>
                <p className={`text-2xl sm:text-3xl font-black font-mono mt-0.5 truncate ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>
                    {timeLeft}s
                </p>
            </div>
        </div>
    );
};
