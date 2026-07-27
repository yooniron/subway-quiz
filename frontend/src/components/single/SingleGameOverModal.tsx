import React from 'react';
import { Trophy, RotateCcw, Home, Award } from 'lucide-react';

interface SingleGameOverModalProps {
    singleScore: number;
    nicknameInput: string;
    onNicknameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmitRanking: (e: React.FormEvent) => void;
    isRankSubmitted: boolean;
    onRestart: () => void;
    onExit: () => void;
    onOpenLeaderboard: () => void;
    allCleared?: boolean;
    answeredCount?: number;
    timeLeft?: number;
}

export const SingleGameOverModal: React.FC<SingleGameOverModalProps> = ({
    singleScore,
    nicknameInput,
    onNicknameChange,
    onSubmitRanking,
    isRankSubmitted,
    onRestart,
    onExit,
    onOpenLeaderboard,
    allCleared = false,
    answeredCount = 0,
    timeLeft = 0
}) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md animate-card-pop">
            <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-yellow-400/10 rounded-full blur-2xl" />
                
                <div className="inline-flex p-4 rounded-2xl bg-yellow-400/10 text-yellow-400 mb-4 border border-yellow-400/20">
                    <Trophy className="w-12 h-12 animate-bounce" />
                </div>

                {allCleared ? (
                    <>
                        <div className="text-4xl mb-2">🏆👑🎉</div>
                        <h2 className="text-2xl font-black text-yellow-400 mb-1">전설의 지하철 고수!</h2>
                        <p className="text-xs text-amber-300 mb-1 font-bold">{answeredCount}개 역 전체 돌파 완료!</p>
                        <p className="text-xs text-gray-400 mb-6 font-medium">남은 시간: {timeLeft}초 | 시간 보너스: +{(timeLeft * 50).toLocaleString()}pts</p>
                    </>
                ) : (
                    <>
                        <h2 className="text-3xl font-black text-white mb-1">TIME UP!</h2>
                        <p className="text-xs text-gray-400 mb-6 font-medium">60초 싱글 챌린지가 완료되었습니다.</p>
                    </>
                )}

                <div className="bg-gray-950/60 border border-gray-800/80 rounded-2xl p-5 mb-6">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">FINAL SCORE</span>
                    <p className="text-4xl font-black text-yellow-400 font-mono mt-1">{singleScore} <span className="text-sm font-normal text-gray-400">pts</span></p>
                    <div className="mt-2 pt-2 border-t border-gray-800/60 flex items-center justify-center gap-1.5 text-xs text-amber-300 font-bold">
                        <span>🎯 총 <strong className="text-yellow-400 font-black">{answeredCount}개 역</strong> 정답 달성!</span>
                    </div>
                </div>

                {!isRankSubmitted ? (
                    <form onSubmit={onSubmitRanking} className="flex flex-col gap-3 mb-6">
                        <label className="text-xs font-bold text-gray-400 text-left px-1">
                            🏆 명예의 전당 닉네임 등록
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                maxLength={12}
                                value={nicknameInput}
                                onChange={onNicknameChange}
                                placeholder="닉네임 입력 (최대 12자)..."
                                className="flex-1 px-4 py-3 rounded-xl bg-gray-950 border border-gray-800 text-white font-bold text-sm focus:outline-none focus:border-yellow-400"
                            />
                            <button
                                type="submit"
                                className="px-5 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-950 font-black rounded-xl text-sm transition-all shadow-md active:scale-95"
                            >
                                등록
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs font-bold mb-6 flex items-center justify-center gap-2">
                        <Award className="w-4 h-4" /> 랭킹 등록이 완료되었습니다!
                    </div>
                )}

                <div className="flex flex-col gap-2 relative z-30 pointer-events-auto">
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onRestart}
                            className="flex-1 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black rounded-xl text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer z-30"
                        >
                            <RotateCcw className="w-4 h-4" /> 다시 도전
                        </button>
                        <button
                            type="button"
                            onClick={onOpenLeaderboard}
                            className="px-4 py-3.5 bg-yellow-400/10 border border-yellow-400/20 hover:bg-yellow-400/20 text-yellow-300 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 z-30"
                        >
                            <Trophy className="w-4 h-4" /> 랭킹
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={onExit}
                        className="w-full py-3 bg-gray-950 hover:bg-gray-800 text-gray-400 hover:text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-1 border border-gray-800 cursor-pointer active:scale-95 z-30"
                    >
                        <Home className="w-4 h-4" /> 메인 메뉴로 이동
                    </button>
                </div>
            </div>
        </div>
    );
};
