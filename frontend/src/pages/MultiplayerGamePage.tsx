import React from 'react';
import { Users } from 'lucide-react';
import type { Quiz, PlayerRole, RoomStatus } from '../types';
import { QuizCard } from '../components/game/QuizCard';
import { AnswerForm } from '../components/game/AnswerForm';
import { ScoreBoard } from '../components/game/ScoreBoard';
import { CorrectOverlay } from '../components/common/CorrectOverlay';

interface MultiplayerGamePageProps {
    roomId: string | null;
    roomStatus: RoomStatus;
    quiz: Quiz | null;
    scores: { p1: number; p2: number };
    myRole: PlayerRole;
    timeLeft: number;
    userInput: string;
    isInputShaking: boolean;
    isShaking: boolean;
    showCorrectOverlay: boolean;
    floatingPoints: number | null;
    inputRef: React.RefObject<HTMLInputElement>;
    showL1: boolean;
    showL2: boolean;
    showHintChar: boolean;
    // Rematch 관련
    p1RematchReady: boolean;
    p2RematchReady: boolean;
    // 이벤트 핸들러
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onAnswerSubmit: (e: React.FormEvent) => void;
    onExitRoom: () => void;
    onRematchRequest: () => void;
}

export const MultiplayerGamePage: React.FC<MultiplayerGamePageProps> = ({
    roomId,
    roomStatus,
    quiz,
    scores,
    myRole,
    timeLeft,
    userInput,
    isInputShaking,
    isShaking,
    showCorrectOverlay,
    floatingPoints,
    inputRef,
    showL1,
    showL2,
    showHintChar,
    p1RematchReady,
    p2RematchReady,
    onInputChange,
    onAnswerSubmit,
    onExitRoom,
    onRematchRequest
}) => {
    // 1대1 대기방 UI
    if (roomStatus === 'WAITING') {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white font-sans px-4 relative overflow-hidden">
                <div className="flex flex-col items-center justify-center max-w-sm w-full bg-gray-900/80 border border-gray-800 p-8 rounded-3xl shadow-2xl backdrop-blur-md text-center animate-card-pop">
                    <Users className="w-16 h-16 text-yellow-400 mb-4 animate-bounce" />
                    <h2 className="text-2xl font-black mb-1">상대 대전 상대 매칭 중...</h2>
                    <p className="text-xs text-gray-400 mb-6 font-medium">실시간 대기열에서 상대를 탐색하고 있습니다.</p>
                    
                    <div className="w-full bg-gray-950 border border-gray-800 p-3 rounded-2xl mb-6">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">ROOM ID</span>
                        <span className="text-xs font-mono text-yellow-400 font-bold break-all">{roomId}</span>
                    </div>

                    <button 
                        onClick={onExitRoom}
                        className="px-6 py-3 bg-gray-950 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white font-bold text-xs rounded-xl transition-all"
                    >
                        매칭 취소 및 메뉴로 이동
                    </button>
                </div>
            </div>
        );
    }

    const isGameOver = roomStatus === 'FINISHED' || scores.p1 >= 1000 || scores.p2 >= 1000;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 text-white font-sans relative overflow-hidden">
            <CorrectOverlay show={showCorrectOverlay} />

            <ScoreBoard 
                scores={scores}
                myRole={myRole}
                roomStatus={roomStatus}
                timeLeft={timeLeft}
                floatingPoints={floatingPoints}
                isShaking={isShaking}
                p1RematchReady={p1RematchReady}
                p2RematchReady={p2RematchReady}
                onRematchRequest={onRematchRequest}
                onExitRoom={onExitRoom}
            />

            {quiz && !isGameOver && (
                <div className="w-full max-w-2xl">
                    <QuizCard 
                        quiz={quiz}
                        mode="MULTIPLAYER"
                        onExit={onExitRoom}
                        showL1={showL1}
                        showL2={showL2}
                        showHintChar={showHintChar}
                    />

                    <AnswerForm 
                        userInput={userInput}
                        onChange={onInputChange}
                        onSubmit={onAnswerSubmit}
                        disabled={isGameOver}
                        isShaking={isInputShaking}
                        placeholder="정답 역명을 타이핑하세요! ⚡"
                        inputRef={inputRef}
                    />

                    <div className="mt-4 text-center">
                        <p className="text-xs text-gray-500 font-mono">⚡ 1,000점에 먼저 달성하는 유저가 즉시 우승합니다!</p>
                    </div>
                </div>
            )}
        </div>
    );
};
