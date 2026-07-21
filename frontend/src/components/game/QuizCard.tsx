import React from 'react';
import { Home, Lightbulb } from 'lucide-react';
import type { Quiz } from '../../types';

interface QuizCardProps {
    quiz: Quiz;
    mode: 'SINGLE' | 'MULTIPLAYER';
    onExit: () => void;
    // 싱글 힌트용
    hintCount?: number;
    isHintActive?: boolean;
    onUseHint?: () => void;
    // 멀티 힌트 조건용 (남은 시간 기반)
    showL1?: boolean;
    showL2?: boolean;
    showHintChar?: boolean;
}

export const QuizCard: React.FC<QuizCardProps> = ({
    quiz,
    mode,
    onExit,
    hintCount = 0,
    isHintActive = false,
    onUseHint,
    showL1 = true,
    showL2 = true,
    showHintChar = false
}) => {
    // 초성 힌트 마스킹 헬퍼 함수
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
            if (showHintChar && quiz.target_station_name) {
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
                    <div className="w-16" />
                )}
            </div>

            <div className="relative flex items-center justify-between w-full px-2 py-8 mb-8">
                <div className="absolute left-0 right-0 h-3 -z-10 rounded-full transition-all duration-300" style={{ backgroundColor: quiz.color_code, top: '42%' }} />
                
                <div className={`flex flex-col items-center w-1/5 transition-all ${isL2Visible ? 'opacity-100 scale-100' : 'opacity-20 blur-xs scale-90'}`}>
                    <div className="w-8 h-8 rounded-full border-4 border-white bg-gray-950" />
                    <span className="mt-2 text-xs font-bold truncate max-w-[80px]">{isL2Visible ? quiz.left_2 : '?'}</span>
                </div>
                
                <div className={`flex flex-col items-center w-1/5 transition-all ${isL1Visible ? 'opacity-100 scale-100' : 'opacity-20 blur-xs scale-90'}`}>
                    <div className="w-8 h-8 rounded-full border-4 border-white bg-gray-950" />
                    <span className="mt-2 text-xs font-bold truncate max-w-[80px]">{isL1Visible ? quiz.left_1 : '?'}</span>
                </div>

                <div className="flex flex-col items-center w-1/5">
                    <div className="w-14 h-14 rounded-full border-4 border-yellow-400 bg-white flex items-center justify-center animate-bounce shadow-[0_0_20px_rgba(250,204,21,0.5)]">
                        <span className="text-gray-950 font-black text-lg">{getAnswerPlaceholder()}</span>
                    </div>
                    <span className="mt-2 text-xs font-black text-yellow-400 tracking-wider">[ 정답 ]</span>
                </div>

                <div className={`flex flex-col items-center w-1/5 transition-all ${isL1Visible ? 'opacity-100 scale-100' : 'opacity-20 blur-xs scale-90'}`}>
                    <div className="w-8 h-8 rounded-full border-4 border-white bg-gray-950" />
                    <span className="mt-2 text-xs font-bold truncate max-w-[80px]">{isL1Visible ? quiz.right_1 : '?'}</span>
                </div>

                <div className={`flex flex-col items-center w-1/5 transition-all ${isL2Visible ? 'opacity-100 scale-100' : 'opacity-20 blur-xs scale-90'}`}>
                    <div className="w-8 h-8 rounded-full border-4 border-white bg-gray-950" />
                    <span className="mt-2 text-xs font-bold truncate max-w-[80px]">{isL2Visible ? quiz.right_2 : '?'}</span>
                </div>
            </div>
        </div>
    );
};
