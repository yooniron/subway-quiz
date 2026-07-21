import React from 'react';
import { Flame } from 'lucide-react';
import { FloatingPoints } from '../common/FloatingPoints';

interface SingleScoreBoardProps {
    singleScore: number;
    singleTimeLeft: number;
    comboCount: number;
    floatingPoints: number | null;
    isShaking: boolean;
}

export const SingleScoreBoard: React.FC<SingleScoreBoardProps> = ({
    singleScore,
    singleTimeLeft,
    comboCount,
    floatingPoints,
    isShaking
}) => {
    return (
        <div className={`flex gap-6 w-full max-w-2xl justify-between bg-gray-900/80 border border-gray-800 p-5 rounded-3xl shadow-2xl backdrop-blur-md relative overflow-hidden transition-transform duration-300 mb-6 ${
            isShaking ? 'animate-shake border-red-500/50' : ''
        }`}>
            <div className="text-center flex-1 relative">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">MY SCORE</p>
                <p className="text-3xl font-black font-mono mt-1 text-white">
                    {singleScore}
                </p>
                <FloatingPoints points={floatingPoints} />
            </div>

            <div className="flex flex-col items-center justify-center border-x border-gray-800/80 px-6">
                <span className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 transition-all ${
                    comboCount >= 10 
                        ? 'bg-gradient-to-r from-red-500 to-amber-500 text-white animate-bounce shadow-lg shadow-red-500/30'
                        : comboCount >= 5
                        ? 'bg-yellow-400 text-gray-950 shadow-md'
                        : comboCount >= 3
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-800 text-gray-500'
                }`}>
                    <Flame className="w-4 h-4 fill-current" />
                    {comboCount} COMBO
                </span>
            </div>

            <div className="text-center flex-1">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">TIME LEFT</p>
                <p className={`text-3xl font-black font-mono mt-1 ${singleTimeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>
                    {singleTimeLeft}s
                </p>
            </div>
        </div>
    );
};
