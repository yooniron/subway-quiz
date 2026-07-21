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
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 text-white font-sans relative overflow-hidden">
            <CorrectOverlay show={showCorrectOverlay} />

            <SingleScoreBoard 
                singleScore={singleScore}
                singleTimeLeft={singleTimeLeft}
                comboCount={comboCount}
                floatingPoints={floatingPoints}
                isShaking={isShaking}
            />

            {singleQuiz && (
                <div className="w-full max-w-2xl">
                    <QuizCard 
                        quiz={singleQuiz}
                        mode="SINGLE"
                        onExit={onExit}
                        hintCount={hintCount}
                        isHintActive={isHintActive}
                        onUseHint={onUseHint}
                    />

                    <AnswerForm 
                        userInput={userInput}
                        onChange={onInputChange}
                        onSubmit={onAnswerSubmit}
                        disabled={isSingleOver}
                        isShaking={isInputShaking}
                        placeholder="정답 역명을 입력하세요! 🎯"
                        inputRef={inputRef}
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
                />
            )}
        </div>
    );
};
