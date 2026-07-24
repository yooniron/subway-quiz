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

            {/* 상단 서울교통공사 스타일 LCD 엠블럼 & 노선 띠 헤더 */}
            <div 
                className="flex justify-between items-center px-4 py-2 rounded-2xl mb-6 shadow-md border border-white/10"
                style={{ backgroundColor: quiz.color_code }}
            >
                <div className="flex items-center gap-2">
                    <button 
                        onClick={onExit}
                        className="p-1.5 rounded-lg bg-black/30 hover:bg-black/50 text-white transition-all flex items-center gap-1 text-xs font-bold"
                    >
                        <Home className="w-3.5 h-3.5" /> {mode === 'SINGLE' ? '메뉴' : '기권'}
                    </button>
                    <span className="text-xs font-black tracking-widest text-white flex items-center gap-1">
                        <span className="w-5 h-5 rounded-full bg-white text-gray-950 flex items-center justify-center text-[10px] font-black">S</span>
                        Subway Quiz
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-black/30 rounded-full text-xs font-black text-white tracking-widest border border-white/20">
                        {quiz.line_name} 순환
                    </span>
                    {mode === 'SINGLE' ? (
                        <button 
                            onClick={onUseHint}
                            disabled={hintCount <= 0 || isHintActive}
                            className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition-all ${
                                isHintActive 
                                    ? 'bg-yellow-400 text-gray-950' 
                                    : hintCount > 0 
                                    ? 'bg-black/30 text-yellow-300 hover:bg-black/50' 
                                    : 'bg-black/20 text-gray-400 opacity-50 cursor-not-allowed'
                            }`}
                        >
                            <Lightbulb className="w-3.5 h-3.5" /> 힌트({hintCount})
                        </button>
                    ) : (
                        <button
                            onClick={onPassRequest}
                            disabled={isPassRequested}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                                isPassRequested
                                    ? 'bg-purple-900/80 text-purple-200'
                                    : 'bg-black/30 text-white hover:bg-black/50'
                            }`}
                        >
                            <FastForward className="w-3.5 h-3.5" /> 패스({passCount}/2)
                        </button>
                    )}
                </div>
            </div>

            {/* 중앙 '이번역' 서울교통공사 LCD 퀴즈 디스플레이 */}
            <div className="flex flex-col items-center justify-center my-4 py-4 relative">
                <span className="text-xs sm:text-sm font-bold text-gray-400 tracking-widest uppercase mb-1">
                    이번역
                </span>

                <div className="flex items-center justify-center gap-3 sm:gap-4 my-2">
                    {/* 동그란 호선 역 번호 버블 (예: 239) */}
                    <div 
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-black text-sm sm:text-base shadow-lg border-2 border-white/40"
                        style={{ backgroundColor: quiz.color_code }}
                    >
                        {quiz.target_station_id ? String(quiz.target_station_id).slice(-3) : '239'}
                    </div>

                    {/* 메인 큼직한 정답 타겟 (홍대입구) */}
                    <div className={`px-4 py-2 sm:px-6 sm:py-3 rounded-2xl border-2 flex items-center justify-center transition-all ${
                        isFullReveal 
                            ? 'bg-red-950/80 border-red-500 text-red-300 animate-pulse' 
                            : isChoseongReveal 
                            ? 'bg-amber-950/80 border-amber-400 text-amber-300 animate-bounce' 
                            : 'bg-gray-950 border-gray-700 text-white'
                    }`}>
                        <span className="text-2xl sm:text-4xl font-black tracking-tight drop-shadow-md">
                            {getAnswerPlaceholder()}
                        </span>
                    </div>
                </div>

                <span className="text-[11px] sm:text-xs text-gray-500 font-mono mt-1 tracking-wider">
                    {isFullReveal ? '🚨 정답 대공개!' : isChoseongReveal ? '✨ 초성 힌트' : 'Subway Station Quiz'}
                </span>
            </div>

            {/* 하단 5개 역 노선 트랙 & '<<<<' 열차 진입 진행 화살표 애니메이션 */}
            <div className="relative flex items-center justify-between w-full px-1 sm:px-2 py-6 sm:py-8 mt-4">
                <div 
                    className="absolute left-0 right-0 h-3 -z-10 rounded-full transition-all duration-300" 
                    style={{ backgroundColor: quiz.color_code, top: '35%' }} 
                />
                
                <div className={`flex flex-col items-center w-1/5 transition-all ${isL2Visible ? 'opacity-100' : 'opacity-20 blur-xs'}`}>
                    <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 sm:border-4 border-white bg-gray-950" />
                    <span className="mt-2 text-[10px] sm:text-xs font-bold text-center break-keep-all leading-tight max-w-[60px] sm:max-w-none">{isL2Visible ? quiz.left_2 : '?'}</span>
                </div>
                
                <div className={`flex flex-col items-center w-1/5 transition-all ${isL1Visible ? 'opacity-100' : 'opacity-20 blur-xs'}`}>
                    <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 sm:border-4 border-white bg-gray-950" />
                    <span className="mt-2 text-[10px] sm:text-xs font-bold text-center break-keep-all leading-tight max-w-[60px] sm:max-w-none">{isL1Visible ? quiz.left_1 : '?'}</span>
                </div>

                {/* 중앙 정답 타겟 노드 + 진입 화살표 (<<<<) */}
                <div className="flex flex-col items-center w-1/5 relative">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <span className="text-[10px] sm:text-xs font-black text-yellow-400 animate-pulse tracking-tighter">
                            &lt;&lt;&lt;&lt;
                        </span>
                    </div>
                    <div 
                        className="w-7 h-7 sm:w-9 sm:h-9 rounded-full border-4 border-yellow-400 bg-white text-gray-950 font-black text-xs flex items-center justify-center animate-bounce shadow-[0_0_15px_rgba(250,204,21,0.6)]"
                    >
                        ?
                    </div>
                    <span className="mt-1.5 text-[10px] sm:text-xs font-black text-yellow-400">[ 정답 ]</span>
                </div>

                <div className={`flex flex-col items-center w-1/5 transition-all ${isL1Visible ? 'opacity-100' : 'opacity-20 blur-xs'}`}>
                    <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 sm:border-4 border-white bg-gray-950" />
                    <span className="mt-2 text-[10px] sm:text-xs font-bold text-center break-keep-all leading-tight max-w-[60px] sm:max-w-none">{isL1Visible ? quiz.right_1 : '?'}</span>
                </div>

                <div className={`flex flex-col items-center w-1/5 transition-all ${isL2Visible ? 'opacity-100' : 'opacity-20 blur-xs'}`}>
                    <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 sm:border-4 border-white bg-gray-950" />
                    <span className="mt-2 text-[10px] sm:text-xs font-bold text-center break-keep-all leading-tight max-w-[60px] sm:max-w-none">{isL2Visible ? quiz.right_2 : '?'}</span>
                </div>
            </div>
        </div>
    );
};
