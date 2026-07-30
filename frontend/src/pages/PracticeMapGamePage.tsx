import React, { useState, useEffect } from 'react';
import { QuizCard } from '../components/game/QuizCard';
import { MultipleChoiceOptions } from '../components/practice/MultipleChoiceOptions';
import { CorrectOverlay } from '../components/common/CorrectOverlay';
import type { Quiz } from '../types/index';
import { ArrowLeft, HelpCircle, AlertCircle, Flame, Infinity as InfinityIcon, Hash } from 'lucide-react';
import { playCorrectSound, playWrongSound, playComboSound } from '../lib/sound';

interface PracticeMapGamePageProps {
    quiz: Quiz | null;
    onNextQuiz: () => void;
    onExit: () => void;
}

// 퀴즈 문제 호선별 헷갈리는 대표 오답 역 후보 뱅크 (전광판 미노출 역들로 셔플)
const LINE_DISTRACTORS: Record<string, string[]> = {
    '1호선': ['청량리', '종로5가', '시청', '서울역', '용산', '노량진', '영등포', '구로', '부평', '인천', '수원', '의정부'],
    '2호선': ['을지로입구', '을지로3가', '충정로', '성수', '건대입구', '잠실', '삼성', '선릉', '역삼', '강남', '교대', '서초', '사당', '낙성대', '서울대입구', '신림', '신도림', '대림', '영등포구청', '당산', '합정', '홍대입구', '신촌', '이대', '아현'],
    '3호선': ['대화', '연신내', '독립문', '경복궁', '안국', '충무로', '약수', '옥수', '압구정', '고속터미널', '양재', '수서', '가락시장', '오금'],
    '4호선': ['불암산', '노원', '창동', '혜화', '동대문', '충무로', '명동', '회현', '서울역', '삼각지', '이촌', '동작', '사당', '인덕원', '오이도'],
    '9호선': ['개화', '김포공항', '가양', '염창', '당산', '국회의사당', '여의도', '샛강', '노량진', '동작', '신논현', '선정릉', '봉은사', '종합운동장', '석촌', '올림픽공원', '중앙보훈병원']
};

export const PracticeMapGamePage: React.FC<PracticeMapGamePageProps> = ({
    quiz,
    onNextQuiz,
    onExit
}) => {
    const [practiceScore, setPracticeScore] = useState(0);
    const [practiceCombo, setPracticeCombo] = useState(0);
    const [quizCount, setQuizCount] = useState(0);
    const [showCorrect, setShowCorrect] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [options, setOptions] = useState<string[]>([]);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [wrongToastMessage, setWrongToastMessage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // 퀴즈가 변경될 때마다 전광판 노출 역명을 100% 소거한 4지선다 보기 무작위 생성
    useEffect(() => {
        if (!quiz) return;

        const targetClean = quiz.target_station_name.replace(/역$/, '').trim();

        // 🚫 퀴즈 전광판에 한글로 뜬 모든 역명 집합 (소거 대상)
        const excludedNames = new Set<string>();
        [quiz.target_station_name, quiz.left_2, quiz.left_1, quiz.right_1, quiz.right_2].forEach(name => {
            if (name) {
                excludedNames.add(name.replace(/역$/, '').trim());
            }
        });

        // 해당 호선 및 수도권 전체 디스트랙터 후보군 취합
        const linePool = LINE_DISTRACTORS[quiz.line_name] || LINE_DISTRACTORS['2호선'];
        const allPool = Object.values(LINE_DISTRACTORS).flat();
        const combinedPool = Array.from(new Set([...linePool, ...allPool]));

        // 전광판 노출 역 100% 사전 제외한 오답 후보 추출
        const validDistractors = combinedPool.filter(st => !excludedNames.has(st));
        const shuffledDistractors = validDistractors.sort(() => Math.random() - 0.5);

        // 정답 역 1개 + 문제 미노출 오답 3개 무작위 셔플
        const final4 = [targetClean, ...shuffledDistractors.slice(0, 3)].sort(() => Math.random() - 0.5);
        setOptions(final4);
        setSelectedOption(null);
        setIsProcessing(false);
        setQuizCount(prev => prev + 1);
    }, [quiz]);

    if (!quiz) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white px-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-bold text-gray-300 animate-pulse">🚆 4지선다 스피드 퀴즈 준비 중...</p>
                <button 
                    onClick={onExit}
                    className="mt-6 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-xs font-bold rounded-xl transition-all"
                >
                    메인 메뉴로 돌아가기
                </button>
            </div>
        );
    }

    const handleSelectOption = (option: string) => {
        if (isProcessing) return;
        setSelectedOption(option);

        const targetClean = quiz.target_station_name.replace(/역$/, '').trim();
        const selectedClean = option.replace(/역$/, '').trim();

        if (targetClean === selectedClean) {
            setIsProcessing(true);
            setWrongToastMessage(null);
            setShowCorrect(true);

            const nextCombo = practiceCombo + 1;
            setPracticeScore(prev => prev + 100);
            setPracticeCombo(nextCombo);

            // 🎵 정답 및 콤보 사운드 플레이 (0ms 렌더링 스케줄링)
            setTimeout(() => {
                playCorrectSound();
                if (nextCombo >= 2) {
                    playComboSound(nextCombo);
                }
            }, 0);

            setTimeout(() => {
                setShowCorrect(false);
                setShowHint(false);
                onNextQuiz();
            }, 250);
        } else {
            // 🎵 오답 사운드 플레이
            playWrongSound();
            setPracticeCombo(0);
            setWrongToastMessage(`❌ [${option}역]은(는) 정답이 아닙니다! 다른 보기를 선택하세요.`);
            setTimeout(() => {
                setWrongToastMessage(null);
            }, 2000);
        }
    };

    return (
        <div className="flex flex-col items-center justify-between min-h-screen bg-gray-950 px-4 py-6 text-white font-sans selection:bg-yellow-400 selection:text-gray-950">
            {/* 정답 축하 팝업 */}
            <CorrectOverlay show={showCorrect} points={100} />

            {/* 오답 알림 토스트 바 */}
            {wrongToastMessage && (
                <div className="fixed top-6 z-50 bg-rose-600/90 border-2 border-rose-400 text-white px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-md animate-bounce flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-white" />
                    <span className="text-xs sm:text-sm font-black">{wrongToastMessage}</span>
                </div>
            )}

            {/* 🎯 Score / Combo / Timer 대시보드 (SingleScoreBoard 일관 스타일) */}
            <div className="flex gap-4 w-full max-w-2xl justify-between bg-gray-900/80 border border-gray-800 p-5 rounded-3xl shadow-2xl backdrop-blur-md relative overflow-hidden mb-4">
                {/* 🏅 Score */}
                <div className="text-center flex-1">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">MY SCORE</p>
                    <p className="text-3xl font-black font-mono mt-1 text-white">
                        {practiceScore}
                    </p>
                </div>

                {/* 🔥 Combo */}
                <div className="flex flex-col items-center justify-center border-x border-gray-800/80 px-4 sm:px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 transition-all ${
                        practiceCombo >= 10 
                            ? 'bg-gradient-to-r from-red-500 to-amber-500 text-white animate-bounce shadow-lg shadow-red-500/30'
                            : practiceCombo >= 5
                            ? 'bg-yellow-400 text-gray-950 shadow-md'
                            : practiceCombo >= 3
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-800 text-gray-500'
                    }`}>
                        <Flame className="w-4 h-4 fill-current" />
                        {practiceCombo} COMBO
                    </span>
                </div>

                {/* ⏱️ Timer (무제한) */}
                <div className="text-center flex-1">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">TIME LEFT</p>
                    <p className="text-2xl font-black font-mono mt-1 text-emerald-400 flex items-center justify-center gap-1">
                        <InfinityIcon className="w-6 h-6" />
                    </p>
                </div>
            </div>

            {/* 상단 서브 헤더 바 (호선 뱃지 + 퀴즈 카운트 + 메인메뉴) */}
            <div className="w-full max-w-2xl flex items-center justify-between mb-4 bg-gray-900/60 p-3 rounded-2xl border border-gray-800/60 backdrop-blur-md">
                <button 
                    onClick={onExit}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-2xl transition-transform active:scale-95 text-xs sm:text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    메인 메뉴
                </button>

                <div className="flex items-center gap-2">
                    <span 
                        className="px-3.5 py-1.5 font-black text-xs sm:text-sm text-white rounded-full flex items-center gap-1.5 shadow-md"
                        style={{ backgroundColor: quiz.color_code }}
                    >
                        🚇 {quiz.line_name}
                    </span>
                    <span className="px-3 py-1.5 bg-gray-800 border border-gray-700 text-gray-300 font-bold text-xs rounded-full flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {quizCount}문제
                    </span>
                </div>
            </div>

            {/* 메인 퀴즈 전광판 */}
            <div className="w-full max-w-2xl mb-3">
                <QuizCard 
                    quiz={quiz}
                    mode="SINGLE"
                    onExit={onExit}
                    userInput=""
                    hintCount={99}
                    isHintActive={showHint}
                    onUseHint={() => setShowHint(true)}
                />
            </div>

            {/* 무제한 초성 힌트 안내 카드 */}
            {showHint && (
                <div className="w-full max-w-2xl mb-3 p-3.5 bg-yellow-400/10 border border-yellow-400/40 rounded-2xl text-center backdrop-blur-md animate-pulse">
                    <p className="text-xs text-yellow-400 font-bold flex items-center justify-center gap-1">
                        <HelpCircle className="w-4 h-4" />
                        초성 힌트: {quiz.target_station_name.split('').map(char => {
                            const code = char.charCodeAt(0) - 44032;
                            if (code >= 0 && code <= 11172) {
                                const cho = Math.floor(code / 588);
                                return String.fromCharCode(4352 + cho);
                            }
                            return char;
                        }).join(' ')}
                    </p>
                </div>
            )}

            {/* 🎮 2x2 반응형 4지선다 카드 스피드 터치 섹션 */}
            <div className="w-full max-w-2xl mb-6 flex flex-col items-center">
                <div className="w-full text-center mb-2">
                    <p className="text-xs font-black text-slate-400 tracking-wider">👇 문제에 안 나온 4개 보기 중 정답 역을 맞추세요!</p>
                </div>
                <MultipleChoiceOptions 
                    options={options}
                    selectedOption={selectedOption}
                    targetStationName={quiz.target_station_name}
                    onSelectOption={handleSelectOption}
                    disabled={isProcessing}
                />
            </div>
        </div>
    );
};
