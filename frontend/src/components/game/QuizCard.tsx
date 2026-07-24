import React from 'react';
import { Home, Lightbulb, FastForward } from 'lucide-react';
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
            className="w-full rounded-3xl bg-gray-900/90 p-8 border border-gray-800 shadow-2xl text-center relative overflow-hidden backdrop-blur-xs animate-card-pop"
        >
            <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-20" style={{ backgroundColor: quiz.color_code }} />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20" style={{ backgroundColor: quiz.color_code }} />

            <div className="flex justify-between items-center mb-6">
                <button 
                    onClick={onExit}
                    className="p-2 rounded-xl bg-gray-950 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-all flex items-center gap-1 text-xs font-bold"
                >
                    <Home className="w-4 h-4" /> {mode === 'SINGLE' ? '메뉴' : '기권 및 메뉴'}
                </button>

                <span 
                    className="px-6 py-2 rounded-full font-black text-sm text-white tracking-widest shadow-lg"
                    style={{ backgroundColor: quiz.color_code }}
                >
                    {quiz.line_name}
                </span>

                {mode === 'SINGLE' ? (
                    <button 
                        onClick={onUseHint}
                        disabled={hintCount <= 0 || isHintActive}
                        className={`px-3 py-2 rounded-xl border text-xs font-black flex items-center gap-1.5 transition-all ${
                            isHintActive 
                                ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-300' 
                                : hintCount > 0 
                                ? 'bg-gray-950 border-yellow-500/50 text-yellow-400 hover:bg-yellow-400/10' 
                                : 'bg-gray-950 border-gray-800 text-gray-600 opacity-50 cursor-not-allowed'
                        }`}
                    >
                        <Lightbulb className="w-4 h-4" /> 힌트 ({hintCount})
                    </button>
                ) : (
                    <button
                        onClick={onPassRequest}
                        disabled={isPassRequested}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
                            isPassRequested
                                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 shadow-xs'
                                : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-amber-400 hover:border-amber-400/40'
                        }`}
                        title="양쪽 동의 시 다음 문제로 빠른 스킵"
                    >
                        <FastForward className="w-3.5 h-3.5" />
                        <span>패스 ({passCount}/2)</span>
                    </button>
                )}
            </div>

            <div className="relative flex items-center justify-between w-full px-1 sm:px-2 py-6 sm:py-8 mb-6 sm:mb-8">
                <div className="absolute left-0 right-0 h-2.5 sm:h-3 -z-10 rounded-full transition-all duration-300" style={{ backgroundColor: quiz.color_code, top: '38%' }} />
                
                <div className={`flex flex-col items-center w-1/5 transition-all ${isL2Visible ? 'opacity-100 scale-100' : 'opacity-20 blur-xs scale-90'}`}>
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 sm:border-4 border-white bg-gray-950" />
                    <span className="mt-1.5 text-[10px] sm:text-xs font-bold text-center break-keep-all leading-tight max-w-[60px] sm:max-w-none">{isL2Visible ? quiz.left_2 : '?'}</span>
                </div>
                
                <div className={`flex flex-col items-center w-1/5 transition-all ${isL1Visible ? 'opacity-100 scale-100' : 'opacity-20 blur-xs scale-90'}`}>
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 sm:border-4 border-white bg-gray-950" />
                    <span className="mt-1.5 text-[10px] sm:text-xs font-bold text-center break-keep-all leading-tight max-w-[60px] sm:max-w-none">{isL1Visible ? quiz.left_1 : '?'}</span>
                </div>

                <div className="flex flex-col items-center w-1/5">
                    <div className={`rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                        isFullReveal
                            ? 'w-16 h-12 sm:w-20 sm:h-14 px-2 sm:px-3 border-red-500 bg-red-950/90 text-white animate-pulse shadow-[0_0_25px_rgba(239,68,68,0.8)]'
                            : isChoseongReveal
                            ? 'w-14 h-12 sm:w-16 sm:h-14 border-amber-400 bg-amber-950/90 text-amber-300 animate-bounce shadow-[0_0_20px_rgba(245,158,11,0.6)]'
                            : 'w-12 h-12 sm:w-14 sm:h-14 border-yellow-400 bg-white text-gray-950 animate-bounce shadow-[0_0_20px_rgba(250,204,21,0.5)]'
                    }`}>
                        <span className={`font-black tracking-tight ${
                            isFullReveal ? 'text-xs sm:text-sm text-red-300 font-mono' : isChoseongReveal ? 'text-xs sm:text-sm text-amber-300 font-mono' : 'text-base sm:text-lg text-gray-950'
                        }`}>
                            {getAnswerPlaceholder()}
                        </span>
                    </div>
                    <span className={`mt-1.5 text-[10px] sm:text-xs font-black tracking-wider ${
                        isFullReveal ? 'text-red-400 animate-pulse' : isChoseongReveal ? 'text-amber-400' : 'text-yellow-400'
                    }`}>
                        {isFullReveal ? '[ 🚨 정답! ]' : isChoseongReveal ? '[ ✨ 초성 ]' : '[ 정답 ]'}
                    </span>
                </div>

                <div className={`flex flex-col items-center w-1/5 transition-all ${isL1Visible ? 'opacity-100 scale-100' : 'opacity-20 blur-xs scale-90'}`}>
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 sm:border-4 border-white bg-gray-950" />
                    <span className="mt-1.5 text-[10px] sm:text-xs font-bold text-center break-keep-all leading-tight max-w-[60px] sm:max-w-none">{isL1Visible ? quiz.right_1 : '?'}</span>
                </div>

                <div className={`flex flex-col items-center w-1/5 transition-all ${isL2Visible ? 'opacity-100 scale-100' : 'opacity-20 blur-xs scale-90'}`}>
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 sm:border-4 border-white bg-gray-950" />
                    <span className="mt-1.5 text-[10px] sm:text-xs font-bold text-center break-keep-all leading-tight max-w-[60px] sm:max-w-none">{isL2Visible ? quiz.right_2 : '?'}</span>
                </div>
            </div>
        </div>
    );
};
