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
    // Rematch 및 패스 관련
    p1RematchReady: boolean;
    p2RematchReady: boolean;
    targetScore?: number;
    passCount?: number;
    isPassRequested?: boolean;
    onPassRequest?: () => void;
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
    targetScore = 500,
    passCount = 0,
    isPassRequested = false,
    onPassRequest,
    onInputChange,
    onAnswerSubmit,
    onExitRoom,
    onRematchRequest
}) => {
    // 대기 중(WAITING) 상태일 경우 상위 RoomWaitingModal 모달에서 대기실을 단독 처리하도록 null 리턴
    if (roomStatus === 'WAITING') {
        return null;
    }

    const isGameOver = roomStatus === 'FINISHED' || scores.p1 >= targetScore || scores.p2 >= targetScore;

    return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gray-950 px-3 sm:px-4 py-4 text-white font-sans relative overflow-hidden pb-[env(safe-area-inset-bottom)]">
            <CorrectOverlay show={showCorrectOverlay} />

            <ScoreBoard 
                scores={scores}
                myRole={myRole}
                roomStatus={roomStatus}
                timeLeft={timeLeft}
                floatingPoints={floatingPoints}
                isShaking={isShaking}
                targetScore={targetScore}
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
                        timeLeft={timeLeft}
                        showL1={showL1}
                        showL2={showL2}
                        showHintChar={showHintChar}
                        passCount={passCount}
                        isPassRequested={isPassRequested}
                        onPassRequest={onPassRequest}
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
                        <p className="text-xs text-gray-500 font-mono">⚡ {targetScore.toLocaleString()}점에 먼저 달성하는 유저가 즉시 우승합니다!</p>
                    </div>
                </div>
            )}
        </div>
    );
};
