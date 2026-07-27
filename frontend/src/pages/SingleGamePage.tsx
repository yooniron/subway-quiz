import React from 'react';
import type { Quiz } from '../types';
import { QuizCard } from '../components/game/QuizCard';
import { AnswerForm } from '../components/game/AnswerForm';
import { SingleScoreBoard } from '../components/single/SingleScoreBoard';
import { SingleGameOverModal } from '../components/single/SingleGameOverModal';
import { CorrectOverlay } from '../components/common/CorrectOverlay';

interface SingleGamePageProps {
    singleQuiz: Quiz | null;
    singleScore: number;
    singleTimeLeft: number;
    comboCount: number;
    hintCount: number;
    isHintActive: boolean;
    isSingleOver: boolean;
    userInput: string;
    isInputShaking: boolean;
    isShaking: boolean;
    showCorrectOverlay: boolean;
    floatingPoints: number | null;
    inputRef: React.RefObject<HTMLInputElement>;
    nicknameInput: string;
    isRankSubmitted: boolean;
    allCleared?: boolean;
    answeredCount?: number;
    // 이벤트 핸들러
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onAnswerSubmit: (e: React.FormEvent) => void;
    onUseHint: () => void;
    onExit: () => void;
    onRestart: () => void;
    onNicknameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmitRanking: (e: React.FormEvent) => void;
    onOpenLeaderboard: () => void;
}

export const SingleGamePage: React.FC<SingleGamePageProps> = ({
    singleQuiz,
    singleScore,
    singleTimeLeft,
    comboCount,
    hintCount,
    isHintActive,
    isSingleOver,
    userInput,
    isInputShaking,
    isShaking,
    showCorrectOverlay,
    floatingPoints,
    inputRef,
    nicknameInput,
    isRankSubmitted,
    allCleared = false,
    answeredCount = 0,
    onInputChange,
    onAnswerSubmit,
    onUseHint,
    onExit,
    onRestart,
    onNicknameChange,
    onSubmitRanking,
    onOpenLeaderboard
}) => {
    return (
        <div className={`min-h-screen bg-gray-950 text-white font-sans flex flex-col items-center justify-center p-4 relative overflow-hidden transition-transform ${isShaking ? 'animate-shake' : ''}`}>
            {/* 정답 팡파레 오버레이 */}
            <CorrectOverlay isVisible={showCorrectOverlay} points={floatingPoints} />

            {/* 헤더 및 스코어보드 */}
            <SingleScoreBoard 
                score={singleScore}
                timeLeft={singleTimeLeft}
                comboCount={comboCount}
                onExit={onExit}
            />

            {/* 메인 퀴즈 보드 */}
            {singleQuiz && (
                <div className="w-full max-w-2xl">
                    <QuizCard 
                        quiz={singleQuiz}
                        mode="SINGLE"
                        onExit={onExit}
                        userInput={userInput}
                        hintCount={hintCount}
                        isHintActive={isHintActive}
                        onUseHint={onUseHint}
                    />

                    <AnswerForm 
                        userInput={userInput}
                        onChange={onInputChange}
                        onSubmit={onAnswerSubmit}
                        isShaking={isInputShaking}
                        inputRef={inputRef}
                        colorCode={singleQuiz.color_code}
                    />

                    <div className="mt-4 text-center">
                        <p className="text-xs text-gray-500 font-mono">💡 3/5/10 콤보 달성 시 보너스 추가 시간이 지급됩니다!</p>
                    </div>
                </div>
            )}

            {isSingleOver && (
                <SingleGameOverModal 
                    singleScore={singleScore}
                    nicknameInput={nicknameInput}
                    onNicknameChange={onNicknameChange}
                    onSubmitRanking={onSubmitRanking}
                    isRankSubmitted={isRankSubmitted}
                    onRestart={onRestart}
                    onExit={onExit}
                    onOpenLeaderboard={onOpenLeaderboard}
                    allCleared={allCleared}
                    answeredCount={answeredCount}
                    timeLeft={singleTimeLeft}
                />
            )}
        </div>
    );
};
