import React from 'react';
import { Users, Zap, Trophy } from 'lucide-react';
import { Header } from '../components/common/Header';

interface MainMenuPageProps {
    onStartMatchmaking: () => void;
    onStartSingleMode: () => void;
    onFetchLeaderboard: () => void;
}

export const MainMenuPage: React.FC<MainMenuPageProps> = ({
    onStartMatchmaking,
    onStartSingleMode,
    onFetchLeaderboard
}) => {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white font-sans px-4 relative overflow-hidden">
            {/* 네온 배경 효과 */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col items-center max-w-md w-full text-center z-10 animate-card-pop">
                <Header />

                <div className="w-full bg-gray-900/80 border border-gray-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-md mb-6 text-left">
                    <h2 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-yellow-400" /> GAME RULES
                    </h2>
                    <ul className="text-xs text-gray-300 space-y-2 font-medium leading-relaxed">
                        <li className="flex items-start gap-2">
                            <span className="text-yellow-400 font-bold">•</span>
                            <span>수도권 1~9호선 인접역 힌트를 보고 정답역을 입력하세요.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-yellow-400 font-bold">•</span>
                            <span><b>[1대1 스피드 대전]</b>: 1,000점에 먼저 달성하는 유저가 즉시 우승합니다.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-yellow-400 font-bold">•</span>
                            <span><b>[🎯 싱글 타임어택]</b>: 60초간 콤보 보너스 타임을 모아 명예의 전당에 도전하세요.</span>
                        </li>
                    </ul>
                </div>

                <div className="flex flex-col gap-3 w-full">
                    <button 
                        onClick={onStartMatchmaking}
                        className="w-full py-4 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-950 font-black text-lg rounded-2xl shadow-xl shadow-yellow-400/10 transition-transform transform active:scale-95 flex items-center justify-center gap-2 group"
                    >
                        <Users className="w-6 h-6 transition-transform group-hover:scale-110" />
                        실시간 1대1 대전 매칭 시작
                    </button>

                    <button 
                        onClick={onStartSingleMode}
                        className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-blue-500/10 transition-transform transform active:scale-95 flex items-center justify-center gap-2 group"
                    >
                        <Zap className="w-6 h-6 transition-transform group-hover:scale-110" />
                        🎯 싱글 타임어택 (60초 챌린지)
                    </button>

                    <button 
                        onClick={onFetchLeaderboard}
                        className="w-full py-3.5 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2"
                    >
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        🏆 명예의 전당 (TOP 10 전역 랭킹)
                    </button>
                </div>
            </div>
        </div>
    );
};
