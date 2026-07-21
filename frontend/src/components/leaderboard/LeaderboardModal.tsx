import React from 'react';
import { Trophy, Award } from 'lucide-react';
import type { RankingEntry } from '../../types';

interface LeaderboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    rankingsList: RankingEntry[];
    myId: string;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
    isOpen,
    onClose,
    rankingsList,
    myId
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md animate-card-pop">
            <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl relative">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-yellow-400" /> 명예의 전당 (TOP 10)
                    </h3>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-white font-bold p-1"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1 mb-6">
                    {rankingsList.length === 0 ? (
                        <p className="text-center text-sm text-gray-500 py-8">등록된 랭킹 정보가 없습니다.</p>
                    ) : (
                        rankingsList.map((entry, index) => {
                            const isMe = entry.player_id === myId;
                            const isTop3 = index < 3;
                            return (
                                <div 
                                    key={entry.id || index}
                                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                                        isMe 
                                            ? 'bg-yellow-400/10 border-yellow-400/40 text-yellow-300' 
                                            : isTop3
                                            ? 'bg-gray-950/80 border-gray-800 text-white'
                                            : 'bg-gray-950/40 border-gray-800/60 text-gray-400'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center ${
                                            index === 0 
                                                ? 'bg-yellow-400 text-gray-950 shadow-md' 
                                                : index === 1 
                                                ? 'bg-slate-300 text-gray-950' 
                                                : index === 2 
                                                ? 'bg-amber-700 text-white' 
                                                : 'bg-gray-800 text-gray-400'
                                        }`}>
                                            {index + 1}
                                        </span>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm flex items-center gap-1">
                                                {entry.nickname}
                                                {isMe && <span className="text-[10px] bg-yellow-400 text-gray-950 px-1.5 py-0.2 rounded font-black">나</span>}
                                            </span>
                                            <span className="text-[10px] text-gray-500">
                                                {new Date(entry.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="font-black font-mono text-base text-yellow-400">
                                        {entry.score} <span className="text-xs font-normal text-gray-500">pts</span>
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>

                <button
                    onClick={onClose}
                    className="w-full py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl text-sm transition-all"
                >
                    닫기
                </button>
            </div>
        </div>
    );
};
