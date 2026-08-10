import React from 'react';
import { Users, Zap, Trophy, Layers, Settings2, Compass, Award, Sparkles } from 'lucide-react';
import { Header } from '../components/common/Header';
import { SUBWAY_LINES } from '../components/common/LineSelectorModal';

interface MainMenuPageProps {
    onFetchLeaderboard: () => void;
    selectedLineIds: number[];
    onOpenLineSelectorWithMode: (mode: 'SINGLE' | 'MULTIPLAYER' | 'PRACTICE') => void;
    onStartPractice: () => void;
    onOpenAchievements?: () => void;
    equippedTitle?: string | null;
    unlockedAchievementCount?: number;
}

export const MainMenuPage: React.FC<MainMenuPageProps> = ({
    onFetchLeaderboard,
    selectedLineIds,
    onOpenLineSelectorWithMode,
    onStartPractice: _onStartPractice,
    onOpenAchievements,
    equippedTitle,
    unlockedAchievementCount = 0
}) => {
    const isAllSelected = selectedLineIds.length === SUBWAY_LINES.length;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white font-sans px-4 relative overflow-hidden">
            {/* 네온 배경 효과 */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col items-center max-w-md w-full text-center z-10 animate-card-pop">
                <Header />

                {/* 내 프로필 & 장착 칭호 배지 카드 */}
                {equippedTitle && (
                    <div className="w-full bg-gradient-to-r from-yellow-500/15 via-amber-500/15 to-emerald-500/15 border border-yellow-400/30 rounded-2xl px-4 py-2.5 shadow-lg backdrop-blur-md mb-3 flex items-center justify-between animate-fade-in">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <Sparkles className="w-4 h-4 text-yellow-400 shrink-0 animate-spin-slow" />
                            <span className="text-[11px] text-gray-300 font-bold shrink-0">내 칭호:</span>
                            <span className="text-xs font-black text-yellow-300 truncate tracking-wide">
                                [{equippedTitle}]
                            </span>
                        </div>
                        {onOpenAchievements && (
                            <button
                                onClick={onOpenAchievements}
                                className="text-[10px] font-bold text-yellow-400 hover:text-yellow-300 underline underline-offset-2 shrink-0 cursor-pointer"
                            >
                                변경
                            </button>
                        )}
                    </div>
                )}

                {/* 호선 선택 현황 카드 */}
                <div className="w-full bg-gray-900/90 border border-gray-800 rounded-3xl p-5 shadow-2xl backdrop-blur-md mb-4 text-left">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-yellow-400" />
                            <span className="text-xs font-bold text-gray-300">현재 기본 출제 호선</span>
                        </div>

                        <button 
                            onClick={() => onOpenLineSelectorWithMode('SINGLE')}
                            className="px-3 py-1.5 bg-yellow-400/10 border border-yellow-400/30 hover:bg-yellow-400/20 text-yellow-400 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        >
                            <Settings2 className="w-3.5 h-3.5" />
                            호선 변경
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 items-center">
                        {isAllSelected ? (
                            <span className="px-3 py-1 bg-yellow-400 text-gray-950 font-black text-xs rounded-full shadow-sm">
                                🌟 전체 호선 활성화 (1~9호선 무작위)
                            </span>
                        ) : (
                            SUBWAY_LINES.filter(line => selectedLineIds.includes(line.id)).map(line => (
                                <span 
                                    key={line.id}
                                    className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white shadow-sm"
                                    style={{ backgroundColor: line.color }}
                                >
                                    {line.name}
                                </span>
                            ))
                        )}
                    </div>
                </div>

                <div className="w-full bg-gray-900/80 border border-gray-800/80 rounded-3xl p-5 shadow-2xl backdrop-blur-md mb-6 text-left">
                    <h2 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-yellow-400" /> GAME RULES
                    </h2>
                    <ul className="text-xs text-gray-300 space-y-1.5 font-medium leading-relaxed">
                        <li className="flex items-start gap-2">
                            <span className="text-yellow-400 font-bold">•</span>
                            <span><b>[입장 시 호선 선택]</b>: 고른 호선 조합으로만 대전/타임어택이 기동됩니다.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-yellow-400 font-bold">•</span>
                            <span><b>[1대1 스피드 대전]</b>: 동일 호선을 선택한 라이벌과 1,000점 먼저 달성 대결!</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-yellow-400 font-bold">•</span>
                            <span><b>[🎯 싱글 타임어택]</b>: 호선별/전체 명예의 전당 랭킹에 도전하세요.</span>
                        </li>
                    </ul>
                </div>

                <div className="flex flex-col gap-3 w-full">
                    <button 
                        onClick={() => onOpenLineSelectorWithMode('MULTIPLAYER')}
                        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-emerald-500/20 transition-all transform active:scale-95 flex items-center justify-center gap-2 group border border-emerald-300/30 cursor-pointer"
                    >
                        <Users className="w-6 h-6 transition-transform group-hover:scale-110" />
                        실시간 1대1 대전 매칭 시작
                    </button>

                    <button 
                        onClick={() => onOpenLineSelectorWithMode('SINGLE')}
                        className="w-full py-4 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-gray-950 font-black text-lg rounded-2xl shadow-xl shadow-amber-400/20 transition-all transform active:scale-95 flex items-center justify-center gap-2 group border border-amber-300/40 cursor-pointer"
                    >
                        <Zap className="w-6 h-6 transition-transform group-hover:scale-110 text-gray-950" />
                        🎯 싱글 타임어택 (60초 챌린지)
                    </button>
                    <button 
                        onClick={() => onOpenLineSelectorWithMode('PRACTICE')}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-base rounded-2xl shadow-xl shadow-blue-500/20 transition-all transform active:scale-95 flex items-center justify-center gap-2 group border border-blue-400/30 cursor-pointer"
                    >
                        <Compass className="w-5 h-5 transition-transform group-hover:rotate-45 text-yellow-300" />
                        🗺️ 연습 모드
                    </button>

                    <div className="grid grid-cols-2 gap-2.5 w-full">
                        <button 
                            onClick={onOpenAchievements}
                            className="py-3.5 bg-gray-900/90 border border-yellow-400/30 hover:border-yellow-400/60 hover:bg-gray-800 text-yellow-300 font-bold text-xs sm:text-sm rounded-2xl transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                        >
                            <Award className="w-4 h-4 text-yellow-400" />
                            <span>업적 ({unlockedAchievementCount}/30)</span>
                        </button>

                        <button 
                            onClick={onFetchLeaderboard}
                            className="py-3.5 bg-gray-900/90 border border-gray-800 hover:border-emerald-500/40 hover:bg-gray-800 text-gray-300 hover:text-white font-bold text-xs sm:text-sm rounded-2xl transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                        >
                            <Trophy className="w-4 h-4 text-amber-400" />
                            <span>명예의 전당</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
