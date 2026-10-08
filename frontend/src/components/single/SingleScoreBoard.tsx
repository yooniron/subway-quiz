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
        <div className={`flex gap-2 sm:gap-6 w-full max-w-2xl justify-between bg-gray-950/90 border-2 border-yellow-400/20 p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-2xl backdrop-blur-md relative overflow-hidden transition-transform duration-300 mb-4 sm:mb-6 glass-lcd ${
            isShaking ? 'animate-shake border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : ''
        }`}>
            <div className="text-center flex-1 relative min-w-0">
                <p className="text-[10px] text-yellow-400/90 uppercase tracking-widest font-black">MY SCORE</p>
                <p className="text-2xl sm:text-4xl font-black font-mono mt-0.5 text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.4)] truncate">
                    {score.toLocaleString()} <span className="text-xs text-gray-500 font-sans">pts</span>
                </p>
                <FloatingPoints points={floatingPoints} />
            </div>

            <div className="flex flex-col items-center justify-center border-x border-gray-800/90 px-3 sm:px-6 shrink-0">
                <span className={`px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    comboCount >= 10 
                        ? 'bg-gradient-to-r from-red-500 to-amber-500 text-white animate-bounce shadow-lg shadow-red-500/40 border border-red-300'
                        : comboCount >= 5
                        ? 'bg-yellow-400 text-gray-950 shadow-md shadow-yellow-400/30 font-black'
                        : comboCount >= 3
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-800/80 text-gray-400 border border-gray-700'
                }`}>
                    <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current shrink-0" />
                    {comboCount} COMBO
                </span>
            </div>

            <div className="text-center flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">TIME LEFT</p>
                <p className={`text-2xl sm:text-4xl font-black font-mono mt-0.5 truncate drop-shadow-md ${
                    timeLeft <= 10 ? 'text-red-500 animate-pulse drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'text-emerald-400'
                }`}>
                    ⏱️ {timeLeft}s
                </p>
            </div>
        </div>
    );
};

