import React from 'react';
import { Users, Zap, Trophy, Layers, Settings2, Compass, Award, User, LogIn, LogOut, Cloud, BarChart2 } from 'lucide-react';
import { Header } from '../components/common/Header';
import { SUBWAY_LINES } from '../components/common/LineSelectorModal';

interface MainMenuPageProps {
    onFetchLeaderboard: () => void;
    selectedLineIds: number[];
    onOpenLineSelectorWithMode: (mode: 'SINGLE' | 'MULTIPLAYER' | 'PRACTICE') => void;
    onStartPractice: () => void;
    onOpenAchievements?: () => void;
    onOpenStats?: () => void;
    onOpenPartyRoom?: () => void;
    equippedTitle?: string | null;
    unlockedAchievementCount?: number;
    onOpenAuthModal?: () => void;
    onLogout?: () => void;
    isLoggedIn?: boolean;
    currentUserNickname?: string;
}

export const MainMenuPage: React.FC<MainMenuPageProps> = ({
    onFetchLeaderboard,
    selectedLineIds,
    onOpenLineSelectorWithMode,
    onStartPractice: _onStartPractice,
    onOpenAchievements,
    onOpenStats,
    onOpenPartyRoom,
    equippedTitle,
    unlockedAchievementCount = 0,
    onOpenAuthModal,
    onLogout,
    isLoggedIn = false,
    currentUserNickname = '게스트'
}) => {
    const isAllSelected = selectedLineIds.length === SUBWAY_LINES.length;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white font-sans px-4 relative overflow-hidden subway-grid-pattern">
            {/* 서울 지하철 노선 네온 분위기 앰비언트 글로우 */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 right-5 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col items-center max-w-md w-full text-center z-10 animate-card-pop my-6">
                <Header />

                {/* 내 프로필 & 계정 상태 디지털 뱃지 카드 */}
                <div className="w-full bg-gray-900/90 border border-yellow-400/20 rounded-2xl px-4 py-3 shadow-xl backdrop-blur-md mb-3 flex items-center justify-between animate-fade-in lcd-display-glow">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isLoggedIn 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]' 
                                : 'bg-gray-800 text-gray-400 border border-gray-700'
                        }`}>
                            {isLoggedIn ? <Cloud className="w-4 h-4 animate-pulse" /> : <User className="w-4 h-4" />}
                        </div>
                        <div className="text-left min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm font-black text-white truncate tracking-tight">
                                    {currentUserNickname}
                                </span>
                                {isLoggedIn ? (
                                    <span className="px-2 py-0.5 text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full shrink-0">
                                        클라우드 연동됨
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 text-[9px] font-bold bg-gray-800 text-gray-400 rounded-full shrink-0">
                                        게스트
                                    </span>
                                )}
                            </div>
                            {equippedTitle ? (
                                <p className="text-[11px] font-bold text-yellow-400 truncate mt-0.5 animate-neon-glow">
                                    ✨ [{equippedTitle}]
                                </p>
                            ) : (
                                <p className="text-[10px] text-gray-500 font-medium truncate mt-0.5">
                                    장착된 칭호 없음
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        {isLoggedIn ? (
                            <button
                                onClick={onLogout}
                                className="px-2.5 py-1.5 bg-gray-800/80 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-gray-700 hover:border-red-500/40 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                                title="로그아웃"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                <span>로그아웃</span>
                            </button>
                        ) : (
                            <button
                                onClick={onOpenAuthModal}
                                className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-gray-950 text-xs font-black rounded-xl transition-all flex items-center gap-1 shadow-lg shadow-yellow-400/20 active:scale-95 cursor-pointer"
                            >
                                <LogIn className="w-3.5 h-3.5" />
                                <span>계정 연동</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* 호선 선택 현황 전광판 카드 */}
                <div className="w-full bg-gray-900/90 border border-gray-800 rounded-3xl p-5 shadow-2xl backdrop-blur-md mb-4 text-left relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/5 rounded-full blur-xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-yellow-400" />
                            <span className="text-xs font-bold text-gray-300">현재 기본 출제 노선 네트워크</span>
                        </div>

                        <button 
                            onClick={() => onOpenLineSelectorWithMode('SINGLE')}
                            className="px-3 py-1.5 bg-yellow-400/10 border border-yellow-400/40 hover:bg-yellow-400/20 text-yellow-400 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                        >
                            <Settings2 className="w-3.5 h-3.5" />
                            노선 설정
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 items-center">
                        {isAllSelected ? (
                            <span className="px-3 py-1.5 bg-yellow-400 text-gray-950 font-black text-xs rounded-full shadow-md flex items-center gap-1">
                                🌟 전국 28개 전 노선 활성화 (수도권·부산·대구·대전·광주·GTX)
                            </span>
                        ) : selectedLineIds.length <= 6 ? (
                            SUBWAY_LINES.filter(line => selectedLineIds.includes(line.id)).map(line => (
                                <span 
                                    key={line.id}
                                    className="px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow-sm transition-transform hover:scale-105"
                                    style={{ backgroundColor: line.color }}
                                >
                                    {line.name}
                                </span>
                            ))
                        ) : (
                            <>
                                {SUBWAY_LINES.filter(line => selectedLineIds.includes(line.id)).slice(0, 5).map(line => (
                                    <span 
                                        key={line.id}
                                        className="px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow-sm transition-transform hover:scale-105"
                                        style={{ backgroundColor: line.color }}
                                    >
                                        {line.name}
                                    </span>
                                ))}
                                <span className="px-2.5 py-1 bg-gray-800 text-yellow-400 border border-yellow-400/30 rounded-full text-[11px] font-black shadow-sm">
                                    +{selectedLineIds.length - 5}개 노선 (총 {selectedLineIds.length}개)
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* 게임 규칙 안내 텍스트 */}
                <div className="w-full bg-gray-900/80 border border-gray-800/80 rounded-3xl p-5 shadow-2xl backdrop-blur-md mb-5 text-left">
                    <h2 className="text-xs font-bold text-yellow-400 mb-2 uppercase tracking-widest flex items-center gap-1.5">
                        <Zap className="w-4 h-4" /> GAME RULES & PROTOCOL
                    </h2>
                    <ul className="text-xs text-gray-300 space-y-1.5 font-medium leading-relaxed">
                        <li className="flex items-start gap-2">
                            <span className="text-yellow-400 font-bold">•</span>
                            <span><b>[노선 맞춤 출제]</b> 선택된 지하철 노선 네트워크 상에서 퀴즈가 즉시 기동됩니다.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-yellow-400 font-bold">•</span>
                            <span><b>[1대1 / 파티 대전]</b> 턴제 입력 및 실시간 스피드 입력으로 상대 라이벌과 대결!</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-yellow-400 font-bold">•</span>
                            <span><b>[🎯 싱글 타임어택]</b> 60초 제한시간 내 명예의 전당 점수에 도전하세요.</span>
                        </li>
                    </ul>
                </div>

                {/* 게임 모드 선택 액션 버튼 그룹 */}
                <div className="flex flex-col gap-3 w-full">
                    <button 
                        onClick={onOpenPartyRoom}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-indigo-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 group border border-purple-400/50 cursor-pointer relative overflow-hidden"
                    >
                        <span className="absolute top-2 right-3 text-[10px] font-black bg-yellow-400 text-gray-950 px-2.5 py-0.5 rounded-full shadow-md animate-pulse">
                            NEW 8인 대전
                        </span>
                        <Users className="w-6 h-6 transition-transform group-hover:scale-110 text-yellow-300" />
                        🎮 8인 파티룸 (다인전 서바이벌)
                    </button>

                    <button 
                        onClick={() => onOpenLineSelectorWithMode('MULTIPLAYER')}
                        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-emerald-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 group border border-emerald-300/40 cursor-pointer"
                    >
                        <Users className="w-6 h-6 transition-transform group-hover:scale-110" />
                        실시간 1대1 대전 매칭 시작
                    </button>

                    <button 
                        onClick={() => onOpenLineSelectorWithMode('SINGLE')}
                        className="w-full py-4 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-gray-950 font-black text-lg rounded-2xl shadow-xl shadow-yellow-400/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 group border border-amber-300/60 cursor-pointer"
                    >
                        <Zap className="w-6 h-6 transition-transform group-hover:scale-110 text-gray-950" />
                        🎯 싱글 타임어택 (60초 챌린지)
                    </button>
                    
                    <button 
                        onClick={() => onOpenLineSelectorWithMode('PRACTICE')}
                        className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-base rounded-2xl shadow-xl shadow-blue-500/20 transition-all transform active:scale-95 flex items-center justify-center gap-2 group border border-blue-400/40 cursor-pointer"
                    >
                        <Compass className="w-5 h-5 transition-transform group-hover:rotate-45 text-yellow-300" />
                        🗺️ 노선도 연습 모드
                    </button>

                    {/* 보조 서브 메뉴 Grid 버튼 */}
                    <div className="grid grid-cols-3 gap-2 w-full mt-1">
                        <button 
                            onClick={onOpenAchievements}
                            className="py-3 bg-gray-900/90 border border-yellow-400/30 hover:border-yellow-400/60 hover:bg-gray-800/90 text-yellow-300 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-1 shadow-md cursor-pointer active:scale-95"
                        >
                            <Award className="w-4 h-4 text-yellow-400 shrink-0" />
                            <span>업적 ({unlockedAchievementCount}/30)</span>
                        </button>

                        <button 
                            onClick={onFetchLeaderboard}
                            className="py-3 bg-gray-900/90 border border-gray-800 hover:border-emerald-500/40 hover:bg-gray-800/90 text-gray-300 hover:text-white font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-1 shadow-md cursor-pointer active:scale-95"
                        >
                            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>리더보드</span>
                        </button>

                        <button 
                            onClick={onOpenStats}
                            className="py-3 bg-gray-900/90 border border-blue-400/30 hover:border-blue-400/60 hover:bg-gray-800/90 text-blue-300 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-1 shadow-md cursor-pointer active:scale-95"
                        >
                            <BarChart2 className="w-4 h-4 text-blue-400 shrink-0" />
                            <span>나의 통계</span>
                        </button>
                    </div>

                    {/* 키보드 단축키 안내 뱃지 바 */}
                    <div className="mt-3 pt-2 border-t border-gray-800/80 text-center">
                        <p className="text-[10px] text-gray-500 font-mono flex items-center justify-center gap-1.5 flex-wrap">
                            <span>⌨️ 단축키:</span>
                            <span className="bg-gray-950 px-1.5 py-0.5 rounded border border-gray-800 text-gray-400 font-bold">[M] 음소거</span>
                            <span className="bg-gray-950 px-1.5 py-0.5 rounded border border-gray-800 text-gray-400 font-bold">[Esc] 닫기/나가기</span>
                            <span className="bg-gray-950 px-1.5 py-0.5 rounded border border-gray-800 text-gray-400 font-bold">[Space] 힌트</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

