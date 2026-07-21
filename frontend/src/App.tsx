import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { supabase, generateUUID } from './lib/supabase';
import type { Quiz, RankingEntry, Toast, GameMode, PlayerRole, RoomStatus } from './types';
import { ToastContainer } from './components/common/ToastContainer';
import { LeaderboardModal } from './components/leaderboard/LeaderboardModal';
import { MainMenuPage } from './pages/MainMenuPage';
import { SingleGamePage } from './pages/SingleGamePage';
import { MultiplayerGamePage } from './pages/MultiplayerGamePage';

export default function App() {
    // 유저 식별자
    const [myId] = useState<string>(() => {
        const saved = localStorage.getItem('subway_user_id');
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (saved && uuidRegex.test(saved)) return saved;

        const newId = generateUUID();
        localStorage.setItem('subway_user_id', newId);
        return newId;
    });

    // 전역 게임 모드 상태
    const [gameMode, setGameMode] = useState<GameMode>('MENU');

    // 1대1 대전 상태 변수들
    const [roomId, setRoomId] = useState<string | null>(null);
    const [role, setRole] = useState<PlayerRole>(null);
    const [roomStatus, setRoomStatus] = useState<RoomStatus>('WAITING');
    const [scores, setScores] = useState({ p1: 0, p2: 0 });
    const [quiz, setQuiz] = useState<Quiz | null>(null);

    const [userInput, setUserInput] = useState('');
    const [timeLeft, setTimeLeft] = useState(30);

    // 재경기 수락 상태 변수
    const [p1RematchReady, setP1RematchReady] = useState(false);
    const [p2RematchReady, setP2RematchReady] = useState(false);

    // 싱글모드 타임어택 상태 변수들
    const [singleScore, setSingleScore] = useState(0);
    const [singleTimeLeft, setSingleTimeLeft] = useState(60);
    const [comboCount, setComboCount] = useState(0);
    const [hintCount, setHintCount] = useState(3);
    const [isHintActive, setIsHintActive] = useState(false);
    const [isSingleOver, setIsSingleOver] = useState(false);
    const [singleQuiz, setSingleQuiz] = useState<Quiz | null>(null);

    // 랭킹 및 닉네임 상태 변수들
    const [nicknameInput, setNicknameInput] = useState(() => localStorage.getItem('subway_nickname') || '');
    const [isRankSubmitted, setIsRankSubmitted] = useState(false);
    const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
    const [rankingsList, setRankingsList] = useState<RankingEntry[]>([]);

    // 연출 및 트랜지션용 상태 변수들
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [isShaking, setIsShaking] = useState(false);
    const [isInputShaking, setIsInputShaking] = useState(false);
    const [showCorrectOverlay, setShowCorrectOverlay] = useState(false);
    const [floatingPoints, setFloatingPoints] = useState<number | null>(null);
    
    // 인풋창 포커스 유지를 위한 ref
    const inputRef = useRef<HTMLInputElement | null>(null);

    // 실시간 퀴즈 ID 감지용 ref
    const prevQuizIdRef = useRef<number | null>(null);
    const scoresRef = useRef({ p1: 0, p2: 0 });

    const focusInput = () => {
        setTimeout(() => {
            inputRef.current?.focus();
        }, 30);
    };

    useEffect(() => {
        scoresRef.current = scores;
    }, [scores]);

    const showToast = (type: Toast['type'], message: string) => {
        const id = generateUUID();
        setToasts((prev) => [...prev, { id, type, message }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 2600);
    };

    const triggerCorrectEffects = (points: number) => {
        setShowCorrectOverlay(true);
        setFloatingPoints(points);
        setTimeout(() => setShowCorrectOverlay(false), 400);
        setTimeout(() => setFloatingPoints(null), 850);
    };

    const handleExitRoom = async () => {
        try {
            if (roomId) {
                await supabase.rpc('exit_room', {
                    p_room_id: roomId,
                    p_player_id: myId
                });
            }
        } catch (e) {
            // 예외 방어
        } finally {
            setRoomId(null);
            setRole(null);
            setRoomStatus('WAITING');
            setQuiz(null);
            setScores({ p1: 0, p2: 0 });
            setP1RematchReady(false);
            setP2RematchReady(false);
            setUserInput('');
            setIsSingleOver(false);
            setGameMode('MENU');
            prevQuizIdRef.current = null;
        }
    };

    const fetchLeaderboard = async () => {
        try {
            const { data, error } = await supabase
                .from('rankings')
                .select('*')
                .order('score', { ascending: false })
                .limit(10);

            if (error) {
                showToast('error', "랭킹 정보를 가져오지 못했습니다.");
            } else if (data) {
                setRankingsList(data);
                setIsLeaderboardOpen(true);
            }
        } catch (e: any) {
            showToast('error', "랭킹 데이터 통신 중 오류가 발생했습니다.");
        }
    };

    const startMatchmaking = async () => {
        setGameMode('MULTIPLAYER');
        try {
            const { data, error } = await supabase.rpc('join_or_create_room', { p_player_id: myId });
            if (error) {
                showToast('error', "매칭 에러: " + error.message);
                await handleExitRoom();
                return;
            }
            if (data && data.length > 0) {
                setRoomId(data[0].room_id);
                setRole(data[0].player_role as any);
                showToast('info', "매치메이킹 탐색을 시작합니다...");
            } else {
                showToast('error', "방 생성을 실패하였습니다. 다시 시도해 주세요.");
                await handleExitRoom();
            }
        } catch (e: any) {
            showToast('error', "매칭 중 예외가 발생하여 메인 메뉴로 복귀합니다.");
            await handleExitRoom();
        }
    };

    const startSingleMode = () => {
        setGameMode('SINGLE');
        setSingleScore(0);
        setSingleTimeLeft(60);
        setComboCount(0);
        setHintCount(3);
        setIsHintActive(false);
        setIsSingleOver(false);
        setIsRankSubmitted(false);
        setUserInput('');
        loadSingleQuiz();
    };

    const loadSingleQuiz = async () => {
        try {
            const { data, error } = await supabase.rpc('get_single_quiz');
            if (error) {
                showToast('error', "퀴즈 출제 오류가 발생하여 메인으로 복귀합니다.");
                setGameMode('MENU');
                return;
            }
            if (data && data.length > 0) {
                setSingleQuiz({
                    target_station_id: data[0].target_station_id,
                    target_station_name: data[0].target_station_name,
                    line_name: data[0].line_name,
                    color_code: data[0].color_code,
                    left_2: data[0].left_2,
                    left_1: data[0].left_1,
                    right_1: data[0].right_1,
                    right_2: data[0].right_2
                });
                setIsHintActive(false);
                setUserInput('');
                focusInput();
            } else {
                showToast('error', "퀴즈 데이터를 읽을 수 없어 메뉴로 돌아갑니다.");
                setGameMode('MENU');
            }
        } catch (e: any) {
            showToast('error', "퀴즈 로딩 예외가 발생했습니다.");
            setGameMode('MENU');
        }
    };

    // 싱글모드 타이머 구동 (60초 카운트다운)
    useEffect(() => {
        if (gameMode !== 'SINGLE' || isSingleOver || singleTimeLeft <= 0) return;
        const interval = setInterval(() => {
            setSingleTimeLeft((prev) => {
                if (prev <= 1) {
                    setIsSingleOver(true);
                    confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [gameMode, isSingleOver, singleTimeLeft]);

    const useSingleHint = () => {
        if (hintCount <= 0) {
            showToast('error', "남은 힌트 찬스가 없습니다!");
            return;
        }
        if (isHintActive) {
            showToast('info', "이미 힌트가 활성화되어 있습니다!");
            return;
        }
        setHintCount((prev) => prev - 1);
        setIsHintActive(true);
        showToast('info', "💡 힌트 찬스가 활성화되었습니다!");
        focusInput();
    };

    const handleSingleAnswerSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!singleQuiz || isSingleOver) return;

        const cleanInput = userInput.trim();
        if (!cleanInput) return;

        const cleanTarget = singleQuiz.target_station_name.replace(/역$/, '');
        const cleanUser = cleanInput.replace(/역$/, '');

        if (cleanUser === cleanTarget) {
            const nextCombo = comboCount + 1;
            setComboCount(nextCombo);

            let addedPoints = 100;
            let timeBonus = 0;

            if (nextCombo === 3) {
                timeBonus = 2;
                showToast('score', "🔥 3 COMBO! +2초 보너스 타임! ⏱️");
            } else if (nextCombo === 5) {
                timeBonus = 3;
                addedPoints += 200;
                showToast('score', "⚡ 5 COMBO! +3초 & +200pts 보너스!");
            } else if (nextCombo >= 10 && nextCombo % 5 === 0) {
                timeBonus = 5;
                addedPoints += 500;
                confetti({ particleCount: 80, spread: 60 });
                showToast('score', `👑 ${nextCombo} COMBO 폭주! +5초 & +500pts!`);
            } else {
                showToast('success', `⭕ 정답입니다! (+${addedPoints}pts)`);
            }

            triggerCorrectEffects(addedPoints);

            setSingleScore((prev) => prev + addedPoints);
            if (timeBonus > 0) {
                setSingleTimeLeft((prev) => prev + timeBonus);
            }

            loadSingleQuiz();
            focusInput();
        } else {
            setComboCount(0);
            setIsInputShaking(true);
            setTimeout(() => setIsInputShaking(false), 450);
            showToast('error', `❌ '${cleanInput}'역은 오답입니다! (콤보 리셋)`);
            setUserInput('');
            focusInput();
        }
    };

    const submitSingleRanking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nicknameInput.trim()) {
            showToast('error', "닉네임을 입력해 주세요!");
            return;
        }

        const cleanNick = nicknameInput.trim();
        localStorage.setItem('subway_nickname', cleanNick);

        try {
            const { error } = await supabase.from('rankings').insert({
                player_id: myId,
                nickname: cleanNick,
                score: singleScore
            });

            if (error) {
                showToast('error', "랭킹 등록 실패: " + error.message);
            } else {
                setIsRankSubmitted(true);
                showToast('success', "🏆 명예의 전당 랭킹 등록 완료!");
                fetchLeaderboard();
            }
        } catch (e: any) {
            showToast('error', "랭킹 저장 중 오류가 발생했습니다.");
        }
    };

    // 1대1 대전 소켓 및 Realtime 이벤트 구독
    useEffect(() => {
        if (!roomId || gameMode !== 'MULTIPLAYER') return;

        const fetchRoom = async () => {
            const { data, error } = await supabase
                .from('game_rooms')
                .select('*')
                .eq('id', roomId)
                .single();
            if (error) {
                showToast('error', "방 정보를 불러올 수 없어 메인으로 복귀합니다.");
                await handleExitRoom();
                return;
            }
            if (data) {
                setRoomStatus(data.status);
                setScores({ p1: data.p1_score, p2: data.p2_score });
                setP1RematchReady(data.p1_rematch_ready || false);
                setP2RematchReady(data.p2_rematch_ready || false);

                if (data.status === 'PLAYING' && data.current_station_id) {
                    if (data.current_station_id !== prevQuizIdRef.current) {
                        prevQuizIdRef.current = data.current_station_id;
                        fetchQuizDetails(data.current_station_id);
                    }
                }
            }
        };

        const fetchQuizDetails = async (stationId: number) => {
            const { data, error } = await supabase.rpc('get_quiz_details', { p_station_id: stationId });
            if (error) {
                showToast('error', "퀴즈 상세 정보를 불러오는 데 실패했습니다.");
                return;
            }
            if (data && data.length > 0) {
                setQuiz({
                    target_station_id: data[0].target_station_id,
                    target_station_name: data[0].target_station_name,
                    line_name: data[0].line_name,
                    color_code: data[0].color_code,
                    left_2: data[0].left_2,
                    left_1: data[0].left_1,
                    right_1: data[0].right_1,
                    right_2: data[0].right_2
                });
            }
        };

        fetchRoom();

        const channel = supabase
            .channel(`room:${roomId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'game_rooms',
                filter: `id=eq.${roomId}`
            }, async (payload) => {
                const data = payload.new;
                setRoomStatus(data.status);
                
                const prevP1 = scoresRef.current.p1;
                const prevP2 = scoresRef.current.p2;

                const isP1 = role === 'player_1';
                const myAdded = isP1 ? data.p1_score - prevP1 : data.p2_score - prevP2;
                const oppAdded = isP1 ? data.p2_score - prevP2 : data.p1_score - prevP1;

                if (myAdded > 0) {
                    showToast('score', `⚡ 득점 성공! (+${myAdded}pts)`);
                    confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 } });
                    triggerCorrectEffects(myAdded);
                } else if (oppAdded > 0) {
                    showToast('error', `⚠️ 상대방이 먼저 정답을 맞췄습니다! (+${oppAdded}pts)`);
                    setIsShaking(true);
                    setTimeout(() => setIsShaking(false), 500);
                }

                setScores({ p1: data.p1_score, p2: data.p2_score });
                setP1RematchReady(data.p1_rematch_ready || false);
                setP2RematchReady(data.p2_rematch_ready || false);

                if (data.status === 'PLAYING' && data.current_station_id) {
                    if (data.current_station_id !== prevQuizIdRef.current) {
                        prevQuizIdRef.current = data.current_station_id;
                        fetchQuizDetails(data.current_station_id);
                    }
                }
            })
            .on('presence', { event: 'leave' }, async ({ key }) => {
                showToast('error', "상대방이 세션에서 이탈하여 대전이 종료됩니다.");
                await handleExitRoom();
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({ online_at: new Date().toISOString() });
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    showToast('error', "네트워크 통신 장애로 세션을 안전 종료합니다.");
                    await handleExitRoom();
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId, gameMode, role]);

    useEffect(() => {
        if (quiz?.target_station_id && gameMode === 'MULTIPLAYER') {
            setTimeLeft(30);
            setUserInput('');
            focusInput();
        }
    }, [quiz?.target_station_id, gameMode]);

    useEffect(() => {
        if (gameMode !== 'MULTIPLAYER' || roomStatus !== 'PLAYING' || timeLeft <= 0) return;
        const interval = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [timeLeft, roomStatus, gameMode]);

    useEffect(() => {
        if (gameMode !== 'MULTIPLAYER' || roomStatus !== 'FINISHED' || !roomId) return;
        
        const isWinner = role === 'player_1' ? scores.p1 >= 1000 : scores.p2 >= 1000;
        if (!isWinner) return;

        const interval = setInterval(() => {
            confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 } });
            confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 } });
        }, 1500);

        return () => clearInterval(interval);
    }, [roomStatus, roomId, scores, role, gameMode]);

    const handleAnswerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quiz || !roomId) return;

        const cleanInput = userInput.trim();
        if (!cleanInput) return;

        const addedScore = timeLeft > 20 ? 100 : timeLeft > 10 ? 50 : 20;

        try {
            const { data: isCorrect, error } = await supabase.rpc('submit_answer', {
                p_room_id: roomId,
                p_player_id: myId,
                p_user_input: cleanInput,
                p_points: addedScore
            });

            if (error) {
                showToast('error', "정답 제출 오류: " + error.message);
                return;
            }

            if (isCorrect) {
                setUserInput('');
                focusInput();
            } else {
                showToast('error', `❌ '${cleanInput}'역은 오답입니다!`);
                setIsInputShaking(true);
                setTimeout(() => setIsInputShaking(false), 450);
                setUserInput('');
                focusInput();
            }
        } catch (e: any) {
            showToast('error', "정답 검증 중 예외가 발생했습니다.");
        }
    };

    const handleRematchRequest = async () => {
        try {
            const { error } = await supabase.rpc('request_rematch', {
                p_room_id: roomId,
                p_player_id: myId
            });
            if (error) {
                showToast('error', "재경기 신청 실패: " + error.message);
            } else {
                showToast('info', "⚡ 재경기를 신청하였습니다.");
            }
        } catch (e: any) {
            showToast('error', "재경기 신청 중 오류가 발생했습니다.");
        }
    };

    const showL1 = timeLeft <= 20;
    const showL2 = timeLeft <= 10;
    const showHintChar = timeLeft <= 5;

    return (
        <>
            <ToastContainer toasts={toasts} />
            <LeaderboardModal 
                isOpen={isLeaderboardOpen}
                onClose={() => setIsLeaderboardOpen(false)}
                rankingsList={rankingsList}
                myId={myId}
            />

            {gameMode === 'MENU' && (
                <MainMenuPage 
                    onStartMatchmaking={startMatchmaking}
                    onStartSingleMode={startSingleMode}
                    onFetchLeaderboard={fetchLeaderboard}
                />
            )}

            {gameMode === 'SINGLE' && (
                <SingleGamePage 
                    singleQuiz={singleQuiz}
                    singleScore={singleScore}
                    singleTimeLeft={singleTimeLeft}
                    comboCount={comboCount}
                    hintCount={hintCount}
                    isHintActive={isHintActive}
                    isSingleOver={isSingleOver}
                    userInput={userInput}
                    isInputShaking={isInputShaking}
                    isShaking={isShaking}
                    showCorrectOverlay={showCorrectOverlay}
                    floatingPoints={floatingPoints}
                    inputRef={inputRef}
                    nicknameInput={nicknameInput}
                    isRankSubmitted={isRankSubmitted}
                    onInputChange={(e) => setUserInput(e.target.value)}
                    onAnswerSubmit={handleSingleAnswerSubmit}
                    onUseHint={useSingleHint}
                    onExit={handleExitRoom}
                    onRestart={startSingleMode}
                    onNicknameChange={(e) => setNicknameInput(e.target.value)}
                    onSubmitRanking={submitSingleRanking}
                    onOpenLeaderboard={fetchLeaderboard}
                />
            )}

            {gameMode === 'MULTIPLAYER' && (
                <MultiplayerGamePage 
                    roomId={roomId}
                    roomStatus={roomStatus}
                    quiz={quiz}
                    scores={scores}
                    myRole={role}
                    timeLeft={timeLeft}
                    userInput={userInput}
                    isInputShaking={isInputShaking}
                    isShaking={isShaking}
                    showCorrectOverlay={showCorrectOverlay}
                    floatingPoints={floatingPoints}
                    inputRef={inputRef}
                    showL1={showL1}
                    showL2={showL2}
                    showHintChar={showHintChar}
                    p1RematchReady={p1RematchReady}
                    p2RematchReady={p2RematchReady}
                    onInputChange={(e) => setUserInput(e.target.value)}
                    onAnswerSubmit={handleAnswerSubmit}
                    onExitRoom={handleExitRoom}
                    onRematchRequest={handleRematchRequest}
                />
            )}
        </>
    );
}
