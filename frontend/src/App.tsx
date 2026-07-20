import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Train, Send, Users, Zap, Award, AlertTriangle, Trophy, Flame, Lightbulb, RotateCcw, Home, Sparkles, Crown, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

const supabase = createClient(
    'https://iqzycldodpiutsndfzhq.supabase.co', 
    'sb_publishable_P7iEFxAw2-38dARmK3-gIA_2Z8NIzet'                             
);

interface Quiz {
    target_station_id: number;
    target_station_name: string;
    line_name: string;
    color_code: string;
    left_2: string;
    left_1: string;
    right_1: string;
    right_2: string;
}

interface RankingEntry {
    id: string;
    player_id: string;
    nickname: string;
    score: number;
    created_at: string;
}

interface Toast {
    id: string;
    type: 'success' | 'error' | 'score' | 'info';
    message: string;
}

// 비보안 컨텍스트(HTTP 외부 IP)에서도 동작하는 UUID Fallback 생성 함수
function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        try {
            return crypto.randomUUID();
        } catch (e) {
            // fallback으로 진행
        }
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export default function App() {
    const [myId] = useState<string>(() => {
        const saved = localStorage.getItem('subway_user_id');
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (saved && uuidRegex.test(saved)) return saved;

        const newId = generateUUID();
        localStorage.setItem('subway_user_id', newId);
        return newId;
    });

    // 전역 게임 모드 ('MENU' | 'MULTIPLAYER' | 'SINGLE')
    const [gameMode, setGameMode] = useState<'MENU' | 'MULTIPLAYER' | 'SINGLE'>('MENU');

    // 1대1 대전 상태 변수들
    const [roomId, setRoomId] = useState<string | null>(null);
    const [role, setRole] = useState<'player_1' | 'player_2' | null>(null);
    const [roomStatus, setRoomStatus] = useState<'WAITING' | 'PLAYING' | 'FINISHED'>('WAITING');
    const [player1Id, setPlayer1Id] = useState<string | null>(null);
    const [player2Id, setPlayer2Id] = useState<string | null>(null);
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
    
    // 실시간 퀴즈 ID 감지용 ref
    const prevQuizIdRef = useRef<number | null>(null);
    const scoresRef = useRef({ p1: 0, p2: 0 });

    useEffect(() => {
        scoresRef.current = scores;
    }, [scores]);

    // 커스텀 토스트 알림 헬퍼
    const showToast = (type: Toast['type'], message: string) => {
        const newToast: Toast = { id: generateUUID(), type, message };
        setToasts((prev) => [...prev, newToast]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
        }, 3000);
    };

    // 정답 시 ⭕ CORRECT! 그린 네온 팝업 & 플로팅 득점 연출
    const triggerCorrectEffects = (gainedPoints: number) => {
        setShowCorrectOverlay(true);
        setFloatingPoints(gainedPoints);
        setTimeout(() => {
            setShowCorrectOverlay(false);
            setFloatingPoints(null);
        }, 500);
    };

    // 🛡️ 예외 발생 시 안전한 세션 클리어 및 메인 메뉴 복귀 (Fail-safe)
    const handleExitRoom = async () => {
        if (roomId && role === 'player_1' && roomStatus === 'WAITING') {
            try {
                await supabase.from('game_rooms').delete().eq('id', roomId);
            } catch (e) {
                // 이탈 우선
            }
        }
        setRoomId(null);
        setRoomStatus('WAITING');
        setRole(null);
        setQuiz(null);
        setScores({ p1: 0, p2: 0 });
        setP1RematchReady(false);
        setP2RematchReady(false);
        setGameMode('MENU');
    };

    // 실시간 랭킹 TOP 10 불러오기
    const fetchRankings = async () => {
        try {
            const { data, error } = await supabase
                .from('rankings')
                .select('*')
                .order('score', { ascending: false })
                .limit(10);
            
            if (error) {
                showToast('error', "랭킹 조회 오류: " + error.message);
            } else {
                setRankingsList(data || []);
            }
        } catch (e: any) {
            showToast('error', "랭킹 조회 중 네트워크 예외가 발생했습니다.");
        }
    };

    const openLeaderboard = () => {
        fetchRankings();
        setIsLeaderboardOpen(true);
    };

    // 1대1 매치메이킹 시작
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

    // 싱글 타임어택 모드 시작
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

    // 싱글 퀴즈 단건 로드
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

    // 싱글모드 힌트 사용
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
    };

    // 싱글모드 정답 제출 핸들러
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

            // 역동적인 ⭕ CORRECT! 뱃지 및 플로팅 득점 연출 가동
            triggerCorrectEffects(addedPoints);

            setSingleScore((prev) => prev + addedPoints);
            if (timeBonus > 0) {
                setSingleTimeLeft((prev) => prev + timeBonus);
            }

            loadSingleQuiz();
        } else {
            setComboCount(0);
            setIsInputShaking(true);
            setTimeout(() => setIsInputShaking(false), 450);
            showToast('error', `❌ '${cleanInput}'역은 오답입니다! (콤보 리셋)`);
            setUserInput('');
        }
    };

    // 랭킹 제출
    const submitSingleRanking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nicknameInput.trim()) {
            showToast('error', "닉네임을 입력해 주세요!");
            return;
        }

        const trimmedNickname = nicknameInput.trim().substring(0, 10);
        localStorage.setItem('subway_nickname', trimmedNickname);

        try {
            const { error } = await supabase.from('rankings').insert([
                {
                    player_id: myId,
                    nickname: trimmedNickname,
                    score: singleScore
                }
            ]);

            if (error) {
                showToast('error', "랭킹 등록 실패: " + error.message);
            } else {
                setIsRankSubmitted(true);
                showToast('success', "🏆 명예의 전당 랭킹에 성공적으로 등록되었습니다!");
                openLeaderboard();
            }
        } catch (e: any) {
            showToast('error', "랭킹 등록 중 통신 오류가 발생했습니다.");
        }
    };

    // 1대1 대전용 Realtime 소켓 및 Presence 연동
    useEffect(() => {
        if (!roomId || gameMode !== 'MULTIPLAYER') return;

        const fetchRoom = async () => {
            try {
                const { data, error } = await supabase
                    .from('game_rooms')
                    .select('*')
                    .eq('id', roomId)
                    .single();
                
                if (error || !data) {
                    showToast('error', "방 정보를 불러올 수 없어 메인으로 복귀합니다.");
                    await handleExitRoom();
                    return;
                }
                setRoomStatus(data.status);
                setPlayer1Id(data.player_1);
                setPlayer2Id(data.player_2);
                setScores({ p1: data.p1_score, p2: data.p2_score });
                setP1RematchReady(data.p1_rematch_ready);
                setP2RematchReady(data.p2_rematch_ready);
                if (data.quiz_target_id) {
                    prevQuizIdRef.current = data.quiz_target_id;
                    setQuiz({
                        target_station_id: data.quiz_target_id,
                        target_station_name: data.quiz_target_name,
                        line_name: data.quiz_line_name,
                        color_code: data.quiz_color_code,
                        left_2: data.quiz_left_2,
                        left_1: data.quiz_left_1,
                        right_1: data.quiz_right_1,
                        right_2: data.quiz_right_2
                    });
                }
            } catch (e: any) {
                showToast('error', "방 연결 중 예외가 발생했습니다.");
                await handleExitRoom();
            }
        };

        fetchRoom();

        let isReadyToCleanup = false;
        const cleanupTimer = setTimeout(() => {
            isReadyToCleanup = true;
        }, 3000);

        const channel = supabase.channel(`room:${roomId}`, {
            config: {
                presence: {
                    key: myId,
                },
            },
        });

        channel
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'game_rooms'
            }, (payload) => {
                const data = payload.new;
                if (data.id !== roomId) return;

                setRoomStatus(data.status);
                setPlayer1Id(data.player_1);
                setPlayer2Id(data.player_2);
                setP1RematchReady(data.p1_rematch_ready);
                setP2RematchReady(data.p2_rematch_ready);
                
                const oldScores = scoresRef.current;
                const nextScores = { p1: data.p1_score, p2: data.p2_score };
                setScores(nextScores);

                if (data.quiz_target_id) {
                    setQuiz({
                        target_station_id: data.quiz_target_id,
                        target_station_name: data.quiz_target_name,
                        line_name: data.quiz_line_name,
                        color_code: data.quiz_color_code,
                        left_2: data.quiz_left_2,
                        left_1: data.quiz_left_1,
                        right_1: data.quiz_right_1,
                        right_2: data.quiz_right_2
                    });

                    if (data.quiz_target_id !== prevQuizIdRef.current) {
                        prevQuizIdRef.current = data.quiz_target_id;

                        if (data.last_scorer_id) {
                            const isMe = data.last_scorer_id === myId;
                            
                            let scoreGained = 100;
                            if (data.last_scorer_id === data.player_1) {
                                scoreGained = data.p1_score - oldScores.p1;
                            } else {
                                scoreGained = data.p2_score - oldScores.p2;
                            }
                            if (scoreGained <= 0) scoreGained = 100;

                            if (isMe) {
                                confetti({
                                    particleCount: 120,
                                    spread: 80,
                                    origin: { y: 0.6 }
                                });
                                triggerCorrectEffects(scoreGained);
                                showToast('score', `🔥 SPEED SOLVED! +${scoreGained}pts 획득!`);
                            } else {
                                showToast('error', `🚨 상대방 '${data.last_correct_answer}' 정답! ⚔️`);
                                setIsShaking(true);
                                setTimeout(() => setIsShaking(false), 500);
                            }
                        }
                    }
                }
            })
            .on('presence', { event: 'sync' }, async () => {
                const state = channel.presenceState();
                const activePlayers = Object.keys(state);
                
                if (isReadyToCleanup && activePlayers.length === 0) {
                    await supabase.from('game_rooms').delete().eq('id', roomId);
                }
            })
            .on('presence', { event: 'leave' }, async ({ key }) => {
                try {
                    const { data: currentRoom } = await supabase
                        .from('game_rooms')
                        .select('player_1, player_2, status')
                        .eq('id', roomId)
                        .single();

                    if (!currentRoom || currentRoom.status !== 'PLAYING') return;

                    const opponentId = myId === currentRoom.player_1 ? currentRoom.player_2 : currentRoom.player_1;

                    if (opponentId && key === opponentId) {
                        showToast('info', "상대방의 연결이 끊어져 세션을 안전하게 정리합니다.");
                        await supabase.from('game_rooms').update({ status: 'FINISHED' }).eq('id', roomId);
                        
                        setTimeout(() => {
                            handleExitRoom();
                        }, 2000);
                    }
                } catch (e) {
                    await handleExitRoom();
                }
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
            clearTimeout(cleanupTimer);
            supabase.removeChannel(channel);
        };
    }, [roomId, gameMode]);

    // 1대1 퀴즈 ID 변경 시 카운트다운 타이머 리셋
    useEffect(() => {
        if (quiz?.target_station_id && gameMode === 'MULTIPLAYER') {
            setTimeLeft(30);
            setUserInput('');
        }
    }, [quiz?.target_station_id, gameMode]);

    // 1대1 매 1초마다 카운트다운
    useEffect(() => {
        if (gameMode !== 'MULTIPLAYER' || roomStatus !== 'PLAYING' || timeLeft <= 0) return;
        const interval = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [timeLeft, roomStatus, gameMode]);

    // 1대1 대전 우승 시 연속 폭죽
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
            } else {
                showToast('error', `❌ '${cleanInput}'역은 오답입니다!`);
                setIsInputShaking(true);
                setTimeout(() => setIsInputShaking(false), 450);
                setUserInput('');
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
                showToast('success', "재경기를 신청했습니다! 상대 수락 대기 중...");
            }
        } catch (e: any) {
            showToast('error', "재경기 신청 중 통신 오류가 발생했습니다.");
        }
    };

    const showL2 = true;
    const showL1 = gameMode === 'SINGLE' ? true : timeLeft <= 20;

    const getAnswerPlaceholder = () => {
        if (gameMode === 'SINGLE') {
            if (!singleQuiz) return '?';
            if (isHintActive) {
                const name = singleQuiz.target_station_name.replace(/역$/, '');
                return name.charAt(0) + '○'.repeat(Math.max(0, name.length - 1));
            }
            return '?';
        }

        if (!quiz) return '?';
        if (timeLeft <= 10) {
            const name = quiz.target_station_name.replace(/역$/, '');
            return name.charAt(0) + '○'.repeat(Math.max(0, name.length - 1));
        }
        return '?';
    };

    const amIReady = role === 'player_1' ? p1RematchReady : p2RematchReady;
    const isWinner = role === 'player_1' ? scores.p1 >= 1000 : scores.p2 >= 1000;

    return (
        <div className={`flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 text-white relative transition-transform duration-100 ${isShaking ? 'animate-shake' : ''}`}>
            
            {/* 커스텀 토스트 알림 컨테이너 */}
            <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
                {toasts.map((toast) => (
                    <div 
                        key={toast.id} 
                        className={`flex items-center gap-3 p-4 rounded-2xl shadow-2xl backdrop-blur-md bg-gray-950/80 border animate-toast-in pointer-events-auto ${
                            toast.type === 'score' ? 'border-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.25)]' :
                            toast.type === 'error' ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.25)]' :
                            toast.type === 'success' ? 'border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.25)]' :
                            'border-gray-800'
                        }`}
                    >
                        {toast.type === 'score' && <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />}
                        {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                        {toast.type === 'success' && <Award className="w-5 h-5 text-green-500" />}
                        {toast.type === 'info' && <Train className="w-5 h-5 text-blue-400" />}
                        
                        <span className={`text-sm font-bold ${
                            toast.type === 'score' ? 'text-yellow-300 font-extrabold' :
                            toast.type === 'error' ? 'text-red-300' :
                            toast.type === 'success' ? 'text-green-300' :
                            'text-gray-200'
                        }`}>
                            {toast.message}
                        </span>
                    </div>
                ))}
            </div>

            {/* ⭕ CORRECT! 그린/골드 발광 뱃지 팝업 연출 */}
            {showCorrectOverlay && (
                <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none animate-correct-pop">
                    <div className="bg-gray-950/90 border-2 border-green-400/80 px-8 py-4 rounded-3xl shadow-[0_0_50px_rgba(34,197,94,0.5)] flex items-center gap-3 backdrop-blur-md">
                        <CheckCircle2 className="w-10 h-10 text-green-400 animate-bounce" />
                        <span className="text-3xl font-black text-green-300 tracking-wider">CORRECT!</span>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* 1. 메인 메뉴 화면 (MENU) */}
            {/* ========================================================= */}
            {gameMode === 'MENU' && (
                <div className="flex flex-col items-center justify-center text-center max-w-md w-full relative z-10">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl -z-10" />
                    <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -z-10" />
                    
                    <Train className="w-20 h-20 text-yellow-400 mb-6 animate-bounce"/>
                    <h1 className="text-4xl font-black mb-3 tracking-wider animate-neon-glow">Subway Quiz</h1>
                    <p className="text-gray-400 mb-10 text-center max-w-sm leading-relaxed text-sm">
                        실시간 지하철 노선 네트워크를 활용한<br />
                        <span className="text-yellow-400 font-bold">스피드 지하철 역 맞추기</span> 플랫폼
                    </p>

                    <div className="flex flex-col gap-4 w-full">
                        <button 
                            onClick={startMatchmaking}
                            className="w-full py-5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-950 font-black text-lg rounded-2xl shadow-[0_0_25px_rgba(250,204,21,0.3)] transition-transform transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                        >
                            <Zap className="w-6 h-6 fill-current" />
                            실시간 1대1 대전 매칭
                        </button>

                        <button 
                            onClick={startSingleMode}
                            className="w-full py-5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black text-lg rounded-2xl shadow-[0_0_25px_rgba(59,130,246,0.3)] transition-transform transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                        >
                            <Flame className="w-6 h-6 text-amber-300 fill-current" />
                            싱글 타임어택 (60초 챌린지)
                        </button>

                        <button 
                            onClick={openLeaderboard}
                            className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-yellow-400 font-bold text-base rounded-2xl border border-yellow-500/30 hover:border-yellow-400/60 shadow-lg transition-transform transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mt-2"
                        >
                            <Trophy className="w-5 h-5 text-yellow-400" />
                            명예의 전당 (TOP 10 랭킹)
                        </button>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* 2. 🎯 싱글 타임어택 모드 (SINGLE) */}
            {/* ========================================================= */}
            {gameMode === 'SINGLE' && (
                <div className="w-full max-w-2xl flex flex-col items-center">
                    
                    <div className="flex gap-4 mb-6 w-full max-w-md justify-between bg-gray-900 border border-gray-800 p-4 rounded-2xl relative">
                        <div className="text-center flex-1 relative">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">SCORE</p>
                            <p className="text-3xl font-black font-mono text-yellow-400 mt-1">{singleScore}</p>
                            
                            {/* ✨ 플로팅 득점 텍스트 연출 */}
                            {floatingPoints && (
                                <span className="absolute -top-4 right-2 text-xl font-black text-green-400 animate-float-up pointer-events-none">
                                    +{floatingPoints}
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col items-center justify-center px-4">
                            <span className={`text-xs px-4 py-1.5 rounded-full font-black tracking-widest shadow-md flex items-center gap-1.5 ${
                                comboCount >= 5 ? 'bg-gradient-to-r from-amber-500 to-red-500 text-white animate-pulse' :
                                comboCount >= 3 ? 'bg-yellow-400 text-gray-950' : 'bg-gray-800 text-gray-400'
                            }`}>
                                <Flame className="w-4 h-4 fill-current" />
                                {comboCount} COMBO
                            </span>
                        </div>

                        <div className="text-center flex-1">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">TIME LEFT</p>
                            <p className={`text-3xl font-black font-mono mt-1 ${singleTimeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>
                                {singleTimeLeft}s
                            </p>
                        </div>
                    </div>

                    {singleQuiz && (
                        <div 
                            key={singleQuiz.target_station_id} 
                            className="w-full rounded-3xl bg-gray-900/90 p-8 border border-gray-800 shadow-2xl text-center relative overflow-hidden backdrop-blur-xs animate-card-pop"
                        >
                            <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-20" style={{ backgroundColor: singleQuiz.color_code }} />
                            <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20" style={{ backgroundColor: singleQuiz.color_code }} />

                            <div className="flex justify-between items-center mb-6">
                                <button 
                                    onClick={handleExitRoom}
                                    className="p-2 rounded-xl bg-gray-950 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-all flex items-center gap-1 text-xs font-bold"
                                >
                                    <Home className="w-4 h-4" /> 메뉴
                                </button>

                                <span 
                                    className="px-6 py-2 rounded-full font-black text-sm text-white tracking-widest shadow-lg"
                                    style={{ backgroundColor: singleQuiz.color_code }}
                                >
                                    {singleQuiz.line_name}
                                </span>

                                <button 
                                    onClick={useSingleHint}
                                    disabled={hintCount <= 0 || isHintActive}
                                    className={`px-3 py-2 rounded-xl border text-xs font-black flex items-center gap-1.5 transition-all ${
                                        isHintActive 
                                            ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-300' 
                                            : hintCount > 0 
                                            ? 'bg-gray-950 border-yellow-500/50 text-yellow-400 hover:bg-yellow-400/10' 
                                            : 'bg-gray-950 border-gray-800 text-gray-600 opacity-50 cursor-not-allowed'
                                    }`}
                                >
                                    <Lightbulb className="w-4 h-4" /> 힌트 ({hintCount})
                                </button>
                            </div>

                            <div className="relative flex items-center justify-between w-full px-2 py-8 mb-8">
                                <div className="absolute left-0 right-0 h-3 -z-10 rounded-full transition-all duration-300" style={{ backgroundColor: singleQuiz.color_code, top: '42%' }} />
                                
                                <div className="flex flex-col items-center w-1/5">
                                    <div className="w-8 h-8 rounded-full border-4 border-white bg-gray-950" />
                                    <span className="mt-2 text-xs font-bold truncate max-w-[80px]">{singleQuiz.left_2}</span>
                                </div>
                                
                                <div className="flex flex-col items-center w-1/5">
                                    <div className="w-8 h-8 rounded-full border-4 border-white bg-gray-950" />
                                    <span className="mt-2 text-xs font-bold truncate max-w-[80px]">{singleQuiz.left_1}</span>
                                </div>

                                <div className="flex flex-col items-center w-1/5">
                                    <div className="w-14 h-14 rounded-full border-4 border-yellow-400 bg-white flex items-center justify-center animate-bounce shadow-[0_0_20px_rgba(250,204,21,0.5)]">
                                        <span className="text-gray-950 font-black text-lg">{getAnswerPlaceholder()}</span>
                                    </div>
                                    <span className="mt-2 text-xs font-black text-yellow-400 tracking-wider">[ 정답 ]</span>
                                </div>

                                <div className="flex flex-col items-center w-1/5">
                                    <div className="w-8 h-8 rounded-full border-4 border-white bg-gray-950" />
                                    <span className="mt-2 text-xs font-bold truncate max-w-[80px]">{singleQuiz.right_1}</span>
                                </div>

                                <div className="flex flex-col items-center w-1/5">
                                    <div className="w-8 h-8 rounded-full border-4 border-white bg-gray-950" />
                                    <span className="mt-2 text-xs font-bold truncate max-w-[80px]">{singleQuiz.right_2}</span>
                                </div>
                            </div>

                            <form onSubmit={handleSingleAnswerSubmit} className="flex gap-2 max-w-sm mx-auto relative">
                                <input
                                    type="text"
                                    disabled={isSingleOver}
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    placeholder="정답 역명을 입력하세요! 🎯"
                                    className={`flex-1 px-5 py-4 rounded-xl bg-gray-950 border border-gray-800 text-white font-bold placeholder:text-gray-600 focus:outline-none focus:border-yellow-400 focus:shadow-[0_0_15px_rgba(250,204,21,0.25)] transition-all duration-300 ${
                                        isInputShaking ? 'animate-shake border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] text-red-400' : ''
                                    }`}
                                />
                                <button 
                                    type="submit"
                                    disabled={isSingleOver}
                                    className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black rounded-xl transition-all transform active:scale-95 shadow-md flex items-center justify-center"
                                >
                                    <Send className="w-5 h-5"/>
                                </button>
                            </form>

                            <div className="mt-6 flex flex-col items-center gap-1">
                                <p className="text-xs text-gray-500 font-mono">💡 3/5/10 콤보 달성 시 보너스 추가 시간이 지급됩니다!</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 싱글모드 타임업 결과 모달 */}
            {gameMode === 'SINGLE' && isSingleOver && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-md p-4 animate-toast-in">
                    <div className="w-full max-w-md rounded-3xl p-8 border border-yellow-500/30 bg-gray-900/90 shadow-[0_0_50px_rgba(250,204,21,0.2)] text-center relative overflow-hidden backdrop-blur-md">
                        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-yellow-500/20 blur-3xl" />
                        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-amber-500/20 blur-3xl" />

                        <Sparkles className="w-20 h-20 text-yellow-400 mx-auto mb-4 animate-bounce" />
                        <h2 className="text-4xl font-black tracking-wider text-yellow-400 mb-1 animate-neon-glow">TIME UP!</h2>
                        <p className="text-gray-400 text-xs mb-6">60초 타임어택 도전 완료!</p>

                        <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-6 mb-6">
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">최종 달성 점수</p>
                            <p className="text-5xl font-black font-mono text-yellow-400 tracking-tight">{singleScore} <span className="text-lg font-bold text-gray-400">pts</span></p>
                        </div>

                        {!isRankSubmitted ? (
                            <form onSubmit={submitSingleRanking} className="flex flex-col gap-3 mb-4">
                                <label className="text-xs text-gray-400 font-bold text-left px-1">🏆 랭킹 등록 닉네임 (최대 10자)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        maxLength={10}
                                        value={nicknameInput}
                                        onChange={(e) => setNicknameInput(e.target.value)}
                                        placeholder="닉네임 입력..."
                                        className="flex-1 px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-white font-bold focus:outline-none focus:border-yellow-400"
                                    />
                                    <button
                                        type="submit"
                                        className="px-5 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-950 font-black rounded-xl transition-all shadow-md active:scale-95"
                                    >
                                        등록
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 font-bold text-sm mb-6 flex items-center justify-center gap-2">
                                <Award className="w-5 h-5 text-green-400" /> 명예의 전당 등록 완수!
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={startSingleMode}
                                className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
                            >
                                <RotateCcw className="w-4 h-4" /> 다시 도전
                            </button>
                            <button
                                onClick={handleExitRoom}
                                className="px-6 py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl transition-all border border-gray-700 active:scale-95"
                            >
                                메뉴로
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* 4. ⚡ 1대1 대전 모드 (MULTIPLAYER) */}
            {/* ========================================================= */}
            {gameMode === 'MULTIPLAYER' && roomStatus === 'WAITING' && (
                <div className="flex flex-col items-center justify-center bg-gray-950 text-white px-4 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
                    <Users className="w-20 h-20 text-blue-400 mb-4 animate-pulse"/>
                    <h2 className="text-3xl font-extrabold tracking-wide">상대 플레이어 대기 중...</h2>
                    <p className="text-gray-500 mt-3 text-sm font-mono bg-gray-900 border border-gray-800 px-4 py-2 rounded-xl">Room ID: {roomId}</p>
                    <button
                        onClick={handleExitRoom}
                        className="mt-6 px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-400 rounded-xl text-xs font-bold border border-gray-800"
                    >
                        대기 취소
                    </button>
                </div>
            )}

            {gameMode === 'MULTIPLAYER' && roomStatus !== 'WAITING' && (
                <div className="w-full max-w-2xl flex flex-col items-center">
                    <div className="flex gap-6 mb-8 w-full max-w-md justify-between bg-gray-900 border border-gray-800 p-4 rounded-2xl relative">
                        <div className="text-center flex-1 relative">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Player 1 {role === 'player_1' ? "(나)" : "(상대)"}</p>
                            <p className="text-3xl font-black font-mono text-blue-400 mt-1">{scores.p1}</p>
                            {role === 'player_1' && floatingPoints && (
                                <span className="absolute -top-4 right-2 text-xl font-black text-green-400 animate-float-up pointer-events-none">
                                    +{floatingPoints}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col items-center justify-center px-4">
                            <span className="text-[11px] bg-gradient-to-r from-red-500 to-amber-500 text-white px-4 py-1.5 rounded-full font-black tracking-widest shadow-md">
                                ⚡ TARGET: 1000
                            </span>
                        </div>
                        <div className="text-center flex-1 relative">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Player 2 {role === 'player_2' ? "(나)" : "(상대)"}</p>
                            <p className="text-3xl font-black font-mono text-red-400 mt-1">{scores.p2}</p>
                            {role === 'player_2' && floatingPoints && (
                                <span className="absolute -top-4 right-2 text-xl font-black text-green-400 animate-float-up pointer-events-none">
                                    +{floatingPoints}
                                </span>
                            )}
                        </div>
                    </div>

                    {quiz && (
                        <div 
                            key={quiz.target_station_id} 
                            className="w-full rounded-3xl bg-gray-900/90 p-8 border border-gray-800 shadow-2xl text-center relative overflow-hidden backdrop-blur-xs animate-card-pop"
                        >
                            <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-20" style={{ backgroundColor: quiz.color_code }} />
                            <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20" style={{ backgroundColor: quiz.color_code }} />

                            <div className="flex justify-between items-center mb-6">
                                <button 
                                    onClick={handleExitRoom}
                                    className="p-2 rounded-xl bg-gray-950 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-all flex items-center gap-1 text-xs font-bold"
                                >
                                    <Home className="w-4 h-4" /> 기권 및 메뉴
                                </button>

                                <span 
                                    className="px-6 py-2 rounded-full font-black text-sm text-white tracking-widest shadow-lg"
                                    style={{ backgroundColor: quiz.color_code }}
                                >
                                    {quiz.line_name}
                                </span>

                                <div className="w-16" />
                            </div>

                            <div className="relative flex items-center justify-between w-full px-2 py-8 mb-8">
                                <div className="absolute left-0 right-0 h-3 -z-10 rounded-full transition-all duration-300" style={{ backgroundColor: quiz.color_code, top: '42%' }} />
                                
                                <div className={`flex flex-col items-center w-1/5 transition-all ${showL2 ? 'opacity-100 scale-100' : 'opacity-20 blur-xs scale-90'}`}>
                                    <div className="w-8 h-8 rounded-full border-4 border-white bg-gray-950" />
                                    <span className="mt-2 text-xs font-bold truncate max-w-[80px]">{showL2 ? quiz.left_2 : '?'}</span>
                                </div>
                                
                                <div className={`flex flex-col items-center w-1/5 transition-all ${showL1 ? 'opacity-100 scale-100' : 'opacity-20 blur-xs scale-90'}`}>
                                    <div className="w-8 h-8 rounded-full border-4 border-white bg-gray-950" />
                                    <span className="mt-2 text-xs font-bold truncate max-w-[80px]">{showL1 ? quiz.left_1 : '?'}</span>
                                </div>

                                <div className="flex flex-col items-center w-1/5">
                                    <div className="w-14 h-14 rounded-full border-4 border-yellow-400 bg-white flex items-center justify-center animate-bounce shadow-[0_0_20px_rgba(250,204,21,0.5)]">
                                        <span className="text-gray-950 font-black text-lg">{getAnswerPlaceholder()}</span>
                                    </div>
                                    <span className="mt-2 text-xs font-black text-yellow-400 tracking-wider">[ 정답 ]</span>
                                </div>

                                <div className={`flex flex-col items-center w-1/5 transition-all ${showL1 ? 'opacity-100 scale-100' : 'opacity-20 blur-xs scale-90'}`}>
                                    <div className="w-8 h-8 rounded-full border-4 border-white bg-gray-950" />
                                    <span className="mt-2 text-xs font-bold truncate max-w-[80px]">{showL1 ? quiz.right_1 : '?'}</span>
                                </div>

                                <div className={`flex flex-col items-center w-1/5 transition-all ${showL2 ? 'opacity-100 scale-100' : 'opacity-20 blur-xs scale-90'}`}>
                                    <div className="w-8 h-8 rounded-full border-4 border-white bg-gray-950" />
                                    <span className="mt-2 text-xs font-bold truncate max-w-[80px]">{showL2 ? quiz.right_2 : '?'}</span>
                                </div>
                            </div>

                            <form onSubmit={handleAnswerSubmit} className="flex gap-2 max-w-sm mx-auto relative">
                                <input
                                    type="text"
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    placeholder="정답 역명을 타이핑하세요! ⚡"
                                    className={`flex-1 px-5 py-4 rounded-xl bg-gray-950 border border-gray-800 text-white font-bold placeholder:text-gray-600 focus:outline-none focus:border-yellow-400 focus:shadow-[0_0_15px_rgba(250,204,21,0.25)] transition-all duration-300 ${
                                        isInputShaking ? 'animate-shake border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] text-red-400' : ''
                                    }`}
                                />
                                <button 
                                    type="submit"
                                    className="px-6 py-4 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-950 font-black rounded-xl transition-all transform active:scale-95 shadow-md flex items-center justify-center"
                                >
                                    <Send className="w-5 h-5"/>
                                </button>
                            </form>

                            <div className="mt-6 flex flex-col items-center gap-1">
                                <p className="text-xs text-red-400 font-mono tracking-wider animate-pulse">⏱️ 다음 역 힌트 개방까지: {timeLeft}초</p>
                                {timeLeft <= 10 && (
                                    <p className="text-[10px] text-yellow-400/80 font-bold">💡 초성 첫 글자 오픈 찬스 활성화!</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 1대1 대전 종료 모달 */}
            {gameMode === 'MULTIPLAYER' && roomStatus === 'FINISHED' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-md p-4 animate-toast-in">
                    <div className={`w-full max-w-md rounded-3xl p-8 border shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center relative overflow-hidden backdrop-blur-md ${
                        isWinner 
                            ? 'bg-yellow-500/10 border-yellow-400/30 shadow-[0_0_40px_rgba(250,204,21,0.15)]' 
                            : 'bg-red-500/10 border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.15)]'
                    }`}>
                        <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-30 ${isWinner ? 'bg-yellow-400' : 'bg-red-500'}`} />
                        <div className={`absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-30 ${isWinner ? 'bg-amber-400' : 'bg-rose-500'}`} />

                        {isWinner ? (
                            <Award className="w-24 h-24 text-yellow-400 mx-auto mb-6 animate-bounce" />
                        ) : (
                            <AlertTriangle className="w-24 h-24 text-red-500 mx-auto mb-6 animate-pulse" />
                        )}
                        
                        <h2 className={`text-4xl font-black tracking-widest mb-2 ${
                            isWinner ? 'text-yellow-400 animate-neon-glow' : 'text-red-500'
                        }`}>
                            {isWinner ? 'VICTORY!' : 'DEFEAT..'}
                        </h2>
                        
                        <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                            {isWinner 
                                ? '축하합니다! 1000점에 먼저 도달하여 대전에서 최종 승리하셨습니다. 🔥' 
                                : '아쉽습니다! 상대방이 먼저 1000점에 도달하여 승리를 가져갔습니다. 💀'}
                        </p>

                        <div className="bg-gray-950/60 border border-gray-800 rounded-2xl p-5 flex justify-between items-center mb-8 relative z-10">
                            <div className="text-center flex-1">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Player 1 {role === 'player_1' ? "(나)" : ""}</p>
                                <p className="text-3xl font-black font-mono text-blue-400 mt-1">{scores.p1}</p>
                            </div>
                            <div className="text-xs text-gray-600 font-extrabold px-3">VS</div>
                            <div className="text-center flex-1">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Player 2 {role === 'player_2' ? "(나)" : ""}</p>
                                <p className="text-3xl font-black font-mono text-red-400 mt-1">{scores.p2}</p>
                            </div>
                        </div>

                        <div className="text-xs text-gray-400 mb-8 flex justify-center gap-3 relative z-10">
                            <span className={`px-4 py-2 rounded-full border font-bold transition-all duration-300 ${
                                p1RematchReady 
                                    ? 'bg-green-500/20 border-green-500/50 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.2)]' 
                                    : 'bg-gray-900/60 border-gray-800 text-gray-500'
                            }`}>
                                P1 {p1RematchReady ? '재경기 수락 🔄' : '준비 중..'}
                            </span>
                            <span className={`px-4 py-2 rounded-full border font-bold transition-all duration-300 ${
                                p2RematchReady 
                                    ? 'bg-green-500/20 border-green-500/50 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.2)]' 
                                    : 'bg-gray-900/60 border-gray-800 text-gray-500'
                            }`}>
                                P2 {p2RematchReady ? '재경기 수락 🔄' : '준비 중..'}
                            </span>
                        </div>

                        <div className="flex gap-3 relative z-10">
                            <button
                                onClick={handleRematchRequest}
                                disabled={amIReady}
                                className={`flex-1 py-4 font-black text-sm rounded-xl transition-all shadow-md transform hover:scale-105 active:scale-95 ${
                                    amIReady 
                                        ? 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed opacity-80' 
                                        : 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-950 shadow-[0_0_20px_rgba(250,204,21,0.25)]'
                                }`}
                            >
                                {amIReady ? '🔄 상대방의 수락 대기 중' : '🔄 재경기 수락'}
                            </button>
                            <button
                                onClick={handleExitRoom}
                                className="px-6 py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl transition-all hover:scale-105 active:scale-95 border border-gray-700"
                            >
                                🚪 퇴장
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* 5. 🏆 명예의 전당 (리더보드 모달) */}
            {/* ========================================================= */}
            {isLeaderboardOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-md p-4 animate-toast-in">
                    <div className="w-full max-w-lg rounded-3xl p-8 border border-yellow-500/30 bg-gray-900/95 shadow-[0_0_60px_rgba(250,204,21,0.2)] text-center relative overflow-hidden backdrop-blur-md">
                        
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <Trophy className="w-7 h-7 text-yellow-400" />
                                <h2 className="text-2xl font-black text-yellow-400 tracking-wider">명예의 전당 (TOP 10)</h2>
                            </div>
                            <button 
                                onClick={() => setIsLeaderboardOpen(false)}
                                className="px-3 py-1.5 rounded-xl bg-gray-950 border border-gray-800 text-gray-400 hover:text-white text-xs font-bold"
                            >
                                닫기 ✖
                            </button>
                        </div>

                        <div className="flex flex-col gap-2.5 max-h-96 overflow-y-auto pr-1">
                            {rankingsList.length === 0 ? (
                                <p className="text-gray-500 text-sm py-10">아직 등록된 랭킹 기록이 없습니다.<br />첫 번째 챔피언이 되어 보세요! 🏆</p>
                            ) : (
                                rankingsList.map((rank, index) => {
                                    const isTop1 = index === 0;
                                    const isTop2 = index === 1;
                                    const isTop3 = index === 2;
                                    const isMe = rank.player_id === myId;

                                    return (
                                        <div 
                                            key={rank.id} 
                                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                                isTop1 ? 'bg-yellow-500/15 border-yellow-400/50 text-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.15)]' :
                                                isTop2 ? 'bg-slate-400/15 border-slate-300/40 text-slate-200' :
                                                isTop3 ? 'bg-amber-700/15 border-amber-600/40 text-amber-300' :
                                                isMe ? 'bg-blue-500/10 border-blue-500/40 text-blue-300' :
                                                'bg-gray-950/60 border-gray-800 text-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm">
                                                    {isTop1 && <Crown className="w-6 h-6 text-yellow-400 animate-bounce" />}
                                                    {isTop2 && <span className="text-slate-300 font-extrabold text-base">2</span>}
                                                    {isTop3 && <span className="text-amber-500 font-extrabold text-base">3</span>}
                                                    {!isTop1 && !isTop2 && !isTop3 && <span className="text-gray-500 font-bold text-xs">{index + 1}</span>}
                                                </div>

                                                <div className="text-left">
                                                    <p className="font-extrabold text-sm flex items-center gap-1.5">
                                                        {rank.nickname}
                                                        {isMe && <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold">나</span>}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 font-mono">
                                                        {new Date(rank.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-lg font-black font-mono text-yellow-400">{rank.score} <span className="text-xs font-normal text-gray-400">pts</span></p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
