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
    p1RematchReady,
    p2RematchReady,
    onRematchRequest,
    onExitRoom
}) => {
    const isP1 = myRole === 'player_1';
    const myScore = isP1 ? scores.p1 : scores.p2;
    const opponentScore = isP1 ? scores.p2 : scores.p1;

    const myRematch = isP1 ? p1RematchReady : p2RematchReady;
    const opponentRematch = isP1 ? p2RematchReady : p1RematchReady;

    const isWinner = myScore >= 1000;
    const isOpponentWinner = opponentScore >= 1000;
    const isGameOver = roomStatus === 'FINISHED' || isWinner || isOpponentWinner;

    return (
        <div className="w-full max-w-2xl mb-6 flex flex-col gap-4">
            <div className={`flex gap-6 w-full justify-between bg-gray-900/80 border border-gray-800 p-5 rounded-3xl shadow-2xl backdrop-blur-md relative overflow-hidden transition-transform duration-300 ${
                isShaking ? 'animate-shake border-red-500/50' : ''
            }`}>
                <div className="text-center flex-1 relative">
                    <div className="flex items-center justify-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                        <p className="text-[10px] font-black tracking-widest text-blue-400 uppercase">P1 (나)</p>
                    </div>
                    <p className="text-4xl font-black font-mono mt-1 text-white tracking-tight">
                        {scores.p1}
                    </p>
                    {isP1 && <FloatingPoints points={floatingPoints} />}
                </div>

                <div className="flex flex-col items-center justify-center border-x border-gray-800/80 px-6">
                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">SPEED MATCH</span>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-2xl font-black font-mono ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
                            {timeLeft}s
                        </span>
                    </div>
                </div>

                <div className="text-center flex-1 relative">
                    <div className="flex items-center justify-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                        <p className="text-[10px] font-black tracking-widest text-red-400 uppercase">P2 (상대)</p>
                    </div>
                    <p className="text-4xl font-black font-mono mt-1 text-white tracking-tight">
                        {scores.p2}
                    </p>
                    {!isP1 && <FloatingPoints points={floatingPoints} />}
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
                        {isWinner ? "1,000점에 먼저 도달하여 매치에서 우승했습니다!" : "상대방이 먼저 1,000점을 획득하였습니다."}
                    </p>

                    <div className="flex gap-3 justify-center max-w-sm mx-auto">
                        <button
                            onClick={onRematchRequest}
                            disabled={myRematch}
                            className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                myRematch
                                    ? 'bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-950 shadow-lg shadow-yellow-400/20 active:scale-95'
                            }`}
                        >
                            <RotateCcw className="w-4 h-4" />
                            {myRematch ? "상대 응답 대기 중..." : "⚡ 1대1 재경기 신청"}
                        </button>
                        <button
                            onClick={onExitRoom}
                            className="py-3.5 px-5 bg-gray-950 border border-gray-800 hover:border-gray-700 text-gray-300 font-bold text-sm rounded-xl transition-all flex items-center gap-1"
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
