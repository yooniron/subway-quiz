import React from 'react';
import { RotateCcw, Home, Crown, Sparkles } from 'lucide-react';
import type { PlayerRole, RoomStatus } from '../../types';
import { FloatingPoints } from '../common/FloatingPoints';

interface ScoreBoardProps {
    scores: { p1: number; p2: number };
    myRole: PlayerRole;
    roomStatus: RoomStatus;
    timeLeft: number;
    floatingPoints: number | null;
    isShaking: boolean;
    targetScore?: number;
    // Rematch 관련
    p1RematchReady: boolean;
    p2RematchReady: boolean;
    onRematchRequest: () => void;
    onExitRoom: () => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
    scores,
    myRole,
    roomStatus,
    timeLeft,
    floatingPoints,
    isShaking,
    targetScore = 500,
    p1RematchReady,
    p2RematchReady,
    onRematchRequest,
    onExitRoom
}) => {
    const isP1 = myRole === 'player_1';
    const myScore = isP1 ? scores.p1 : scores.p2;
    const opponentScore = isP1 ? scores.p2 : scores.p1;

    const myLabel = isP1 ? "P1 (나)" : "P2 (나)";
    const opponentLabel = isP1 ? "P2 (상대)" : "P1 (상대)";

    const myColor = isP1 ? "text-blue-400" : "text-emerald-400";
    const myPingBg = isP1 ? "bg-blue-400" : "bg-emerald-400";

    const opponentColor = isP1 ? "text-red-400" : "text-amber-400";
    const opponentPingBg = isP1 ? "bg-red-400" : "bg-amber-400";

    const myRematch = isP1 ? p1RematchReady : p2RematchReady;
    const opponentRematch = isP1 ? p2RematchReady : p1RematchReady;

    const isWinner = myScore >= targetScore;
    const isOpponentWinner = opponentScore >= targetScore;
    const isGameOver = roomStatus === 'FINISHED' || isWinner || isOpponentWinner;

    return (
        <div className="w-full max-w-2xl mb-4 sm:mb-6 flex flex-col gap-4">
            <div className={`flex gap-4 sm:gap-6 w-full justify-between bg-gray-950/90 border-2 border-gray-800 p-4 sm:p-5 rounded-3xl shadow-2xl backdrop-blur-md relative overflow-hidden transition-transform duration-300 ${
                isShaking ? 'animate-shake border-red-500/50' : ''
            }`}>
                {/* 좌측 카드: 언제나 접속한 본인 (나 / ME) */}
                <div className="text-center flex-1 relative bg-gray-900/60 p-3 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                        <span className={`w-2 h-2 rounded-full ${myPingBg} animate-ping`} />
                        <p className="text-xs font-black text-gray-300 tracking-wider">{myLabel}</p>
                    </div>
                    <p className={`text-2xl sm:text-3xl font-black font-mono ${myColor} drop-shadow-md`}>
                        {myScore} <span className="text-xs font-sans text-gray-500">pts</span>
                    </p>
                    <FloatingPoints points={floatingPoints} />
                </div>

                {/* 중앙: 실시간 타임어택 전광판 및 목표점수 */}
                <div className="flex flex-col items-center justify-center px-2 min-w-[100px] sm:min-w-[120px]">
                    <span className="text-[10px] sm:text-xs font-black text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/30 mb-1 tracking-wider">
                        목표 {targetScore}pts
                    </span>
                    <div className="flex items-center gap-1">
                        <span className={`text-lg sm:text-2xl font-black font-mono ${
                            timeLeft <= 5 ? 'text-red-500 animate-pulse' : timeLeft <= 10 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                            ⏱️ {timeLeft}s
                        </span>
                    </div>
                </div>

                {/* 우측 카드: 상대방 (OPPONENT) */}
                <div className="text-center flex-1 relative bg-gray-900/60 p-3 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                        <span className={`w-2 h-2 rounded-full ${opponentPingBg} animate-ping`} />
                        <p className="text-xs font-black text-gray-300 tracking-wider">{opponentLabel}</p>
                    </div>
                    <p className={`text-2xl sm:text-3xl font-black font-mono ${opponentColor} drop-shadow-md`}>
                        {opponentScore} <span className="text-xs font-sans text-gray-500">pts</span>
                    </p>
                </div>
            </div>

            {isGameOver && (
                <div className="w-full bg-gray-900/95 border-2 border-yellow-400/50 rounded-3xl p-6 shadow-[0_0_30px_rgba(250,204,21,0.2)] text-center animate-card-pop backdrop-blur-md">
                    <div className="flex justify-center mb-3">
                        {isWinner ? (
                            <div className="p-3 bg-yellow-400/20 border border-yellow-400 rounded-full animate-bounce">
                                <Crown className="w-10 h-10 text-yellow-400" />
                            </div>
                        ) : (
                            <div className="p-3 bg-gray-800 rounded-full">
                                <Sparkles className="w-10 h-10 text-gray-400" />
                            </div>
                        )}
                    </div>

                    <h2 className="text-2xl font-black text-white mb-1">
                        {isWinner ? "🎉 승리하셨습니다! 🏆" : "아쉽게 패배하였습니다 😢"}
                    </h2>
                    <p className="text-xs text-gray-400 mb-6 font-medium">
                        {isWinner ? `${targetScore.toLocaleString()}점에 먼저 도달하여 매치에서 우승했습니다!` : `상대방이 먼저 ${targetScore.toLocaleString()}점을 획득하였습니다.`}
                    </p>

                    <div className="flex gap-3 justify-center max-w-sm mx-auto relative z-30 pointer-events-auto">
                        <button
                            type="button"
                            onClick={onRematchRequest}
                            disabled={myRematch}
                            className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer z-30 ${
                                myRematch
                                    ? 'bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-950 shadow-lg shadow-yellow-400/20 active:scale-95'
                            }`}
                        >
                            <RotateCcw className="w-4 h-4" />
                            {myRematch ? "상대 응답 대기 중..." : "⚡ 1대1 재경기 신청"}
                        </button>
                        <button
                            type="button"
                            onClick={onExitRoom}
                            className="py-3.5 px-5 bg-gray-950 border border-gray-800 hover:border-gray-700 text-gray-300 font-bold text-sm rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95 z-30"
                        >
                            <Home className="w-4 h-4" /> 메뉴
                        </button>
                    </div>

                    {opponentRematch && !myRematch && (
                        <p className="mt-3 text-xs text-yellow-400 font-bold animate-pulse">
                            🔥 상대방이 재경기를 원하고 있습니다! [재경기 신청]을 누르면 즉시 재시작됩니다.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};
