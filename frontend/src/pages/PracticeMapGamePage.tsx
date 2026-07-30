import React, { useState, useEffect, useRef } from 'react';
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

const LINE_DISTRACTORS: Record<string, string[]> = {
    '1호선': ['청량리', '종로5가', '시청', '서울역', '용산', '노량진', '영등포', '구로', '부평', '인천', '수원', '의정부'],
    '2호선': ['을지로입구', '을지로3가', '충정로', '성수', '건대입구', '잠실', '삼성', '선릉', '역삼', '강남', '교대', '서초', '사당', '낙성대', '서울대입구', '신림', '신도림', '대림', '영등포구청', '당산', '합정', '홍대입구', '신촌', '이대', '아현'],
    '3호선': ['대화', '연신내', '독립문', '경복궁', '안국', '충무로', '약수', '옥수', '압구정', '고속터미널', '양재', '수서', '가락시장', '오금'],
    '4호선': ['불암산', '노원', '창동', '혜화', '동대문', '충무로', '명동', '회현', '서울역', '삼각지', '이촌', '동작', '사당', '인덕원', '오이도'],
    '9호선': ['개화', '김포공항', '가양', '염창', '당산', '국회의사당', '여의도', '샛강', '노량진', '동작', '신논현', '선정릉', '봉은사', '종합운동장', '석촌', '올림픽공원', '중앙보훈병원']
};

// ⚡ 모바일 메모리 최적화: 매번 계산하지 않도록 미리 취합해 두기
const ALL_DISTRACTORS_FLAT = Object.values(LINE_DISTRACTORS).flat();

// ⚡ 모바일 CPU 부하 0%에 가까운 고성능 피셔-예이츠 셔플 함수
function shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

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

    // 타이머 관리용 ref
    const correctTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wrongTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

        // 미리 정의된 Flat 배열 활용
        const linePool = LINE_DISTRACTORS[quiz.line_name] || LINE_DISTRACTORS['2호선'];
        const combinedPool = Array.from(new Set([...linePool, ...ALL_DISTRACTORS_FLAT]));

        // 전광판 노출 역 제외 + 피셔-예이츠 셔플 사용
        const validDistractors = combinedPool.filter(st => !excludedNames.has(st));
        const shuffledDistractors = shuffleArray(validDistractors);

        // 정답 역 1개 + 3개 무작위 보기를 고속 셔플
        const final4 = shuffleArray([targetClean, ...shuffledDistractors.slice(0, 3)]);
        
        setOptions(final4);
        setSelectedOption(null);
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
        setSelectedOption(option);

        const targetClean = quiz.target_station_name.replace(/역$/, '').trim();
        const selectedClean = option.replace(/역$/, '').trim();

        if (targetClean === selectedClean) {
            if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
            setWrongToastMessage(null);
            setShowCorrect(true);

            const nextCombo = practiceCombo + 1;
            setPracticeScore(prev => prev + 100);
            setPracticeCombo(nextCombo);

            // 🎵 정답 사운드 실행
            playCorrectSound();
            if (nextCombo >= 2) {
                playComboSound(nextCombo);
            }

            setShowHint(false);
            
            // ⚡ 싱글모드와 100% 동일한 600ms 딜레이 후 매끄럽게 다음 문제로 전환
            if (correctTimerRef.current) clearTimeout(correctTimerRef.current);
            correctTimerRef.current = setTimeout(() => {
                setShowCorrect(false);
                onNextQuiz();
            }, 600);

        } else {
            playWrongSound();
            setPracticeCombo(0);
            setWrongToastMessage(`❌ [${option}역]은(는) 정답이 아닙니다! 다른 보기를 선택하세요.`);
            
            if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
            wrongTimerRef.current = setTimeout(() => {
                setWrongToastMessage(null);
            }, 1500);
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

            {/* 🎯 Score / Combo / Timer 대시보드 */}
            <div className="flex gap-4 w-full max-w-2xl justify-between bg-gray-900/80 border border-gray-800 p-5 rounded-3xl shadow-2xl backdrop-blur-md relative overflow-hidden mb-4">
                <div className="text-center flex-1">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">MY SCORE</p>
                    <p className="text-3xl font-black font-mono mt-1 text-white">
                        {practiceScore}
                    </p>
                </div>

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

                <div className="text-center flex-1">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">TIME LEFT</p>
                    <p className="text-2xl font-black font-mono mt-1 text-emerald-400 flex items-center justify-center gap-1">
                        <InfinityIcon className="w-6 h-6" />
                    </p>
                </div>
            </div>

            {/* 상단 서브 헤더 바 */}
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

            {/* 초성 힌트 안내 카드 */}
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

            {/* 🎮 2x2 반응형 4지선다 카드 */}
            <div className="w-full max-w-2xl mb-6 flex flex-col items-center">
                <div className="w-full text-center mb-2">
                    <p className="text-xs font-black text-slate-400 tracking-wider">👇 문제에 안 나온 4개 보기 중 정답 역을 맞추세요!</p>
                </div>
                <MultipleChoiceOptions 
                    options={options}
                    selectedOption={selectedOption}
                    targetStationName={quiz.target_station_name}
                    onSelectOption={handleSelectOption}
                    disabled={false}
                />
            </div>
        </div>
    );
};
