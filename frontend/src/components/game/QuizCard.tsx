import React from 'react';
import { Home, Lightbulb, FastForward, Train } from 'lucide-react';
import type { Quiz } from '../../types';
import { getChoseong } from '../../utils/hangul';

interface QuizCardProps {
    quiz: Quiz;
    mode: 'SINGLE' | 'MULTIPLAYER';
    onExit: () => void;
    // 싱글 힌트용
    hintCount?: number;
    isHintActive?: boolean;
    onUseHint?: () => void;
    // 멀티 힌트 조건용 (남은 시간 기반)
    timeLeft?: number;
    showL1?: boolean;
    showL2?: boolean;
    showHintChar?: boolean;
    passCount?: number;
    isPassRequested?: boolean;
    onPassRequest?: () => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({
    quiz,
    mode,
    onExit,
    hintCount = 0,
    isHintActive = false,
    onUseHint,
    timeLeft = 30,
    showL1 = true,
    showL2 = true,
    showHintChar = false,
    passCount = 0,
    isPassRequested = false,
    onPassRequest
}) => {
    // 2단계 스피드 빌드업 힌트 마스킹 헬퍼 함수
    const getAnswerPlaceholder = () => {
        if (mode === 'SINGLE') {
            if (isHintActive && quiz.target_station_name) {
                const targetName = quiz.target_station_name.replace(/역$/, '');
                const firstChar = targetName.charAt(0);
                const restLength = targetName.length - 1;
                return `${firstChar}${restLength > 0 ? '○'.repeat(restLength) : ''}`;
            }
            return '?';
        } else {
            // MULTIPLAYER 2단계 스피드 빌드업
            if (timeLeft <= 3 && quiz.target_station_name) {
                // 3초 ~ 1초: 🚨 정답 전체 대공개 (스피드 키보드 타격전)
                return quiz.target_station_name;
            } else if (timeLeft <= 10 && quiz.target_station_name) {
                // 10초 ~ 4초: ✨ 초성 힌트 대공개
                return getChoseong(quiz.target_station_name);
            } else if (showHintChar && quiz.target_station_name) {
                const targetName = quiz.target_station_name.replace(/역$/, '');
                const firstChar = targetName.charAt(0);
                const restLength = targetName.length - 1;
                return `${firstChar}${restLength > 0 ? '○'.repeat(restLength) : ''}`;
            }
            return '?';
        }
    };

    const isL1Visible = mode === 'SINGLE' ? true : showL1;
    const isL2Visible = mode === 'SINGLE' ? true : showL2;

    const isFullReveal = mode === 'MULTIPLAYER' && timeLeft <= 3;
    const isChoseongReveal = mode === 'MULTIPLAYER' && timeLeft > 3 && timeLeft <= 10;

    return (
        <div 
            key={quiz.target_station_id} 
            className="w-full max-w-2xl sm:max-w-3xl rounded-[2.5rem] bg-gray-950/95 p-6 sm:p-10 border-4 sm:border-8 border-gray-800 shadow-[0_30px_70px_rgba(0,0,0,0.8)] text-center relative overflow-hidden backdrop-blur-md animate-card-pop"
        >
            <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-25" style={{ backgroundColor: quiz.color_code }} />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-25" style={{ backgroundColor: quiz.color_code }} />

            {/* 상단 노선 띠 헤더 (저작권 문제없는 독자 지하철 Train 엠블럼 적용) */}
            <div 
                className="flex justify-between items-center px-5 py-3 rounded-2xl mb-8 shadow-lg border border-white/20"
                style={{ backgroundColor: quiz.color_code }}
            >
                <div className="flex items-center gap-2.5">
                    <button 
                        onClick={onExit}
                        className="p-2 rounded-xl bg-black/40 hover:bg-black/60 text-white transition-all flex items-center gap-1.5 text-xs font-bold"
                    >
                        <Home className="w-4 h-4" /> {mode === 'SINGLE' ? '메뉴' : '기권'}
                    </button>
                    <span className="text-xs sm:text-sm font-black tracking-widest text-white flex items-center gap-2">
                        <Train className="w-5 h-5 text-white" />
                        Subway Quiz LIVE
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="px-3.5 py-1.5 bg-black/40 rounded-full text-xs sm:text-sm font-black text-white tracking-widest border border-white/20">
                        {quiz.line_name} 순환
                    </span>
                    {mode === 'SINGLE' ? (
                        <button 
                            onClick={onUseHint}
                            disabled={hintCount <= 0 || isHintActive}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                                isHintActive 
                                    ? 'bg-yellow-400 text-gray-950' 
                                    : hintCount > 0 
                                    ? 'bg-black/40 text-yellow-300 hover:bg-black/60' 
                                    : 'bg-black/20 text-gray-400 opacity-50 cursor-not-allowed'
                            }`}
                        >
                            <Lightbulb className="w-4 h-4" /> 힌트({hintCount})
                        </button>
                    ) : (
                        <button
                            onClick={onPassRequest}
                            disabled={isPassRequested}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                                isPassRequested
                                    ? 'bg-purple-900/80 text-purple-200'
                                    : 'bg-black/40 text-white hover:bg-black/60'
                            }`}
                        >
                            <FastForward className="w-4 h-4" /> 패스({passCount}/2)
                        </button>
                    )}
                </div>
            </div>

            {/* 중앙 '이번역' 전철역 승강장 안내 전광판 퀴즈 디스플레이 */}
            <div className="flex flex-col items-center justify-center my-6 py-4 relative">
                <span className="text-xs sm:text-sm font-bold text-gray-400 tracking-widest uppercase mb-2">
                    이번역 (Next Station)
                </span>

                <div className="flex items-center justify-center gap-4 sm:gap-6 my-3 w-full">
                    {/* 동그란 호선 역 번호 버블 (2배 이상 큼직하게 스케일업!) */}
                    <div 
                        className="w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white font-black text-lg sm:text-2xl shadow-xl border-4 border-white/50 shrink-0"
                        style={{ backgroundColor: quiz.color_code }}
                    >
                        {quiz.target_station_id ? String(quiz.target_station_id).slice(-3) : '239'}
                    </div>

                    {/* 메인 큼직한 가로 넉넉 정답 타겟 카드 [ ? ] */}
                    <div className={`w-full max-w-md sm:max-w-xl px-6 py-4 sm:px-10 sm:py-6 rounded-3xl border-4 flex items-center justify-center transition-all shadow-2xl ${
                        isFullReveal 
                            ? 'bg-red-950/90 border-red-500 text-red-300 animate-pulse' 
                            : isChoseongReveal 
                            ? 'bg-amber-950/90 border-amber-400 text-amber-300 animate-bounce' 
                            : 'bg-gray-900/90 border-gray-700 text-white'
                    }`}>
                        <span className="text-3xl sm:text-6xl font-black tracking-tight drop-shadow-lg">
                            {getAnswerPlaceholder()}
                        </span>
                    </div>
                </div>

                <span className="text-xs sm:text-sm text-gray-400 font-mono mt-2 tracking-wider">
                    {isFullReveal ? '🚨 정답 대공개!' : isChoseongReveal ? '✨ 초성 힌트 대공개' : 'Subway Station Quiz'}
                </span>
            </div>

            {/* 하단 5개 역 노선 트랙 & Pure CSS 제작 지하철 전동차 객차 수평 주행 모션 */}
            <div className="relative flex items-center justify-between w-full px-2 sm:px-4 py-8 sm:py-10 mt-6">
                <div 
                    className="absolute left-0 right-0 h-4 sm:h-5 -z-10 rounded-full transition-all duration-300 shadow-inner" 
                    style={{ backgroundColor: quiz.color_code, top: '35%' }} 
                />
                
                <div className={`flex flex-col items-center w-1/5 transition-all ${isL2Visible ? 'opacity-100' : 'opacity-20 blur-xs'}`}>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-4 border-white bg-gray-950 flex items-center justify-center shadow-lg">
                        <span className="w-3 h-3 rounded-full bg-white/70" />
                    </div>
                    <span className="mt-3 text-xs sm:text-sm font-bold text-center break-keep-all leading-tight max-w-[70px] sm:max-w-none">{isL2Visible ? quiz.left_2 : '?'}</span>
                </div>
                
                <div className={`flex flex-col items-center w-1/5 transition-all ${isL1Visible ? 'opacity-100' : 'opacity-20 blur-xs'}`}>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-4 border-white bg-gray-950 flex items-center justify-center shadow-lg">
                        <span className="w-3 h-3 rounded-full bg-white/70" />
                    </div>
                    <span className="mt-3 text-xs sm:text-sm font-bold text-center break-keep-all leading-tight max-w-[70px] sm:max-w-none">{isL1Visible ? quiz.left_1 : '?'}</span>
                </div>

                {/* 중앙 정답 타겟 노드 + Pure CSS 지하철 객차 수평 주행 (Metro Train Car Component) */}
                <div className="flex flex-col items-center w-1/5 relative">
                    <div className="flex items-center justify-center gap-1.5 mb-2">
                        {/* Pure CSS 지하철 객차 모듈 (창문 2개 + 노선 띠 + 헤드라이트) */}
                        <div 
                            className="w-12 h-6 sm:w-14 sm:h-7 rounded-lg border-2 border-white flex items-center justify-between px-1 shadow-xl animate-train-drive"
                            style={{ backgroundColor: quiz.color_code }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 shadow-sm" />
                            <div className="flex gap-1">
                                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-xs bg-white/80 border border-black/20" />
                                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-xs bg-white/80 border border-black/20" />
                            </div>
                        </div>
                        <span className="text-xs font-black text-yellow-400 animate-arrow-drive tracking-tighter hidden sm:inline">
                            &lt;&lt;&lt;&lt;
                        </span>
                    </div>
                    <div 
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 border-yellow-400 bg-white text-gray-950 font-black text-sm sm:text-base flex items-center justify-center animate-bounce shadow-[0_0_25px_rgba(250,204,21,0.8)]"
                    >
                        ?
                    </div>
                    <span className="mt-2 text-xs sm:text-sm font-black text-yellow-400 tracking-wider">[ 정답 ]</span>
                </div>

                <div className={`flex flex-col items-center w-1/5 transition-all ${isL1Visible ? 'opacity-100' : 'opacity-20 blur-xs'}`}>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-4 border-white bg-gray-950 flex items-center justify-center shadow-lg">
                        <span className="w-3 h-3 rounded-full bg-white/70" />
                    </div>
                    <span className="mt-3 text-xs sm:text-sm font-bold text-center break-keep-all leading-tight max-w-[70px] sm:max-w-none">{isL1Visible ? quiz.right_1 : '?'}</span>
                </div>

                <div className={`flex flex-col items-center w-1/5 transition-all ${isL2Visible ? 'opacity-100' : 'opacity-20 blur-xs'}`}>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-4 border-white bg-gray-950 flex items-center justify-center shadow-lg">
                        <span className="w-3 h-3 rounded-full bg-white/70" />
                    </div>
                    <span className="mt-3 text-xs sm:text-sm font-bold text-center break-keep-all leading-tight max-w-[70px] sm:max-w-none">{isL2Visible ? quiz.right_2 : '?'}</span>
                </div>
            </div>
        </div>
    );
};
