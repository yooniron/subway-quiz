import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Train, Send, Users, Zap, Award, AlertTriangle } from 'lucide-react';
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
        // UUID v4 표준 규격 체크 정규식
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (saved && uuidRegex.test(saved)) return saved;

        const newId = generateUUID();
        localStorage.setItem('subway_user_id', newId);
        return newId;
    });

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

    // 연출용 상태 변수들
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [isShaking, setIsShaking] = useState(false);
    const [isInputShaking, setIsInputShaking] = useState(false);
    
    // 실시간 퀴즈 ID 변경 감지를 위한 ref
    const prevQuizIdRef = useRef<number | null>(null);
    // 실시간 스코어 계산을 위한 ref
    const scoresRef = useRef({ p1: 0, p2: 0 });

    // 스코어 상태가 바뀔 때마다 ref 업데이트
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

    const startMatchmaking = async () => {
        const { data, error } = await supabase.rpc('join_or_create_room', { p_player_id: myId });
        if (error) return showToast('error', "매칭 에러: " + error.message);
        if (data && data.length > 0) {
            setRoomId(data[0].room_id);
            setRole(data[0].player_role as any);
            showToast('info', "매치메이킹 탐색을 시작합니다...");
        }
    };

    // 1. Fetch initial room state and setup Realtime subscription
    useEffect(() => {
        if (!roomId) return;

        // Fetch current room state immediately
        const fetchRoom = async () => {
            const { data, error } = await supabase
                .from('game_rooms')
                .select('*')
                .eq('id', roomId)
                .single();
            
            if (error) {
                console.error("방 정보 조회 에러:", error.message);
                return;
            }
            if (data) {
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
            }
        };

        fetchRoom();

        // 소켓 초기 연결 도중 track() 동기화 지연에 따른 레이스 컨디션 폭파 방지용 플래그
        let isReadyToCleanup = false;
        const cleanupTimer = setTimeout(() => {
            isReadyToCleanup = true;
        }, 3000); // 3초 예열 시간 부여

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
                // 수동 룸 ID 대조로 유실 방지
                if (data.id !== roomId) return;

                setRoomStatus(data.status);
                setPlayer1Id(data.player_1);
                setPlayer2Id(data.player_2);
                setP1RematchReady(data.p1_rematch_ready);
                setP2RematchReady(data.p2_rematch_ready);
                
                // 실시간 스코어 비교 및 스코어러 연출 처리
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

                    // 퀴즈 ID 변경을 기반으로 득점자 연출 수행
                    if (data.quiz_target_id !== prevQuizIdRef.current) {
                        prevQuizIdRef.current = data.quiz_target_id;

                        if (data.last_scorer_id) {
                            const isMe = data.last_scorer_id === myId;
                            
                            // 획득한 실시간 스코어 득점 차이 계산
                            let scoreGained = 100;
                            if (data.last_scorer_id === data.player_1) {
                                scoreGained = data.p1_score - oldScores.p1;
                            } else {
                                scoreGained = data.p2_score - oldScores.p2;
                            }
                            if (scoreGained <= 0) scoreGained = 100;

                            if (isMe) {
                                // 1. 내가 정답을 맞춘 경우 (쾌감 극대화 연출)
                                confetti({
                                    particleCount: 120,
                                    spread: 80,
                                    origin: { y: 0.6 }
                                });
                                showToast('score', `🔥 SPEED SOLVED! +${scoreGained}pts 획득!`);
                            } else {
                                // 2. 상대방이 정답을 스틸해 간 경우 (경고 알림 배너 및 화면 강한 흔들림)
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
                
                // 3초 예열 완료 이후에만 실제로 찌꺼기 0명 삭제 작동
                if (isReadyToCleanup && activePlayers.length === 0) {
                    await supabase.from('game_rooms').delete().eq('id', roomId);
                }
            })
            .on('presence', { event: 'leave' }, async ({ key }) => {
                // DB를 1회 단독 조회하여 상대방 퇴장 및 세션 종료 처리
                const { data: currentRoom } = await supabase
                    .from('game_rooms')
                    .select('player_1, player_2, status')
                    .eq('id', roomId)
                    .single();

                if (!currentRoom || currentRoom.status !== 'PLAYING') return;

                const opponentId = myId === currentRoom.player_1 ? currentRoom.player_2 : currentRoom.player_1;

                if (opponentId && key === opponentId) {
                    showToast('info', "상대방의 연결이 끊어져 게임이 종료되었습니다.");
                    await supabase.from('game_rooms').update({ status: 'FINISHED' }).eq('id', roomId);
                    
                    setTimeout(() => {
                        setRoomId(null);
                        setRoomStatus('WAITING');
                        setQuiz(null);
                    }, 2000);
                }
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // 온라인 접속 트래킹 활성화
                    await channel.track({ online_at: new Date().toISOString() });
                }
            });

        return () => {
            clearTimeout(cleanupTimer);
            supabase.removeChannel(channel);
        };
    }, [roomId]);

    // 퀴즈 문제 ID가 변경될 때마다 제한시간 30초 및 입력창 리셋
    useEffect(() => {
        if (quiz?.target_station_id) {
            setTimeLeft(30);
            setUserInput('');
        }
    }, [quiz?.target_station_id]);

    // 매 1초마다 카운트다운 타이머 구동
    useEffect(() => {
        if (roomStatus !== 'PLAYING' || timeLeft <= 0) return;
        const interval = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [timeLeft, roomStatus]);

    // 우승 시 폭죽 연속 발사를 위한 타이머 설정
    useEffect(() => {
        if (roomStatus !== 'FINISHED' || !roomId) return;
        
        const isWinner = role === 'player_1' ? scores.p1 >= 1000 : scores.p2 >= 1000;
        if (!isWinner) return;

        // 승리자에게 1.5초마다 연속 폭죽 세례 발사!
        const interval = setInterval(() => {
            confetti({
                particleCount: 50,
                angle: 60,
                spread: 55,
                origin: { x: 0 }
            });
            confetti({
                particleCount: 50,
                angle: 120,
                spread: 55,
                origin: { x: 1 }
            });
        }, 1500);

        return () => clearInterval(interval);
    }, [roomStatus, roomId, scores, role]);

    const handleAnswerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quiz || !roomId) return;

        const cleanInput = userInput.trim();
        if (!cleanInput) return;

        const addedScore = timeLeft > 20 ? 100 : timeLeft > 10 ? 50 : 20;

        // 선착순 정답 검증 RPC 호출
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
            // 정답일 경우 인풋만 초기화 (소켓 변경 이벤트를 통해 전역 연출 동기화)
            setUserInput('');
        } else {
            // 오답 피드백 연출 (인풋창 붉은 셰이크 발생, 신속 오답 알림)
            showToast('error', `❌ '${cleanInput}'역은 오답입니다!`);
            setIsInputShaking(true);
            setTimeout(() => setIsInputShaking(false), 450);
            setUserInput('');
        }
    };

    // 재경기 신청 핸들러
    const handleRematchRequest = async () => {
        const { error } = await supabase.rpc('request_rematch', {
            p_room_id: roomId,
            p_player_id: myId
        });
        if (error) {
            showToast('error', "재경기 신청 실패: " + error.message);
        } else {
            showToast('success', "재경기를 신청했습니다! 상대 수락 대기 중...");
        }
    };

    // 방 퇴장 핸들러 (세션 종료)
    const handleExitRoom = () => {
        setRoomId(null);
        setRoomStatus('WAITING');
        setQuiz(null);
    };

    const showL2 = true; // 양 끝단 역(l2, r2)은 시작 즉시 상시 공개
    const showL1 = timeLeft <= 20; // 1단계 인접역(l1, r1)은 20초 이하일 때 공개

    // 10초 이하일 때 중앙 정답역의 첫 글자(초성) 힌트를 동적으로 변환
    const getAnswerPlaceholder = () => {
        if (!quiz) return '?';
        if (timeLeft <= 10) {
            const name = quiz.target_station_name.replace(/역$/, '');
            return name.charAt(0) + '○'.repeat(Math.max(0, name.length - 1));
        }
        return '?';
    };

    // 현재 플레이어의 재경기 수락 대기 여부 감지
    const amIReady = role === 'player_1' ? p1RematchReady : p2RematchReady;
    // 우승자 여부 판정 (1000점 먼저 도달한 유저 우승)
    const isWinner = role === 'player_1' ? scores.p1 >= 1000 : scores.p2 >= 1000;

    if (!roomId) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white font-sans px-4 relative overflow-hidden">
                {/* 그라데이션 광원 데코 */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                
                <Train className="w-20 h-20 text-yellow-400 mb-6 animate-bounce"/>
                <h1 className="text-4xl font-black mb-2 tracking-wider animate-neon-glow">Subway Quiz</h1>
                <p className="text-gray-400 mb-10 text-center max-w-sm leading-relaxed">
                    실시간 지하철 노선 네트워크를 활용한<br />
                    <span className="text-yellow-400 font-bold">1대1 선착순 스피드 경쟁</span> 플랫폼
                </p>
                <button 
                    onClick={startMatchmaking}
                    className="px-10 py-5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-950 font-black text-xl rounded-2xl shadow-[0_0_30px_rgba(250,204,21,0.3)] transition-transform transform hover:scale-105 active:scale-95"
                >
                    실시간 대전 매칭 시작
                </button>
            </div>
        );
    }

    if (roomStatus === 'WAITING') {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white px-4 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
                <Users className="w-20 h-20 text-blue-400 mb-4 animate-pulse"/>
                <h2 className="text-3xl font-extrabold tracking-wide">상대 플레이어 대기 중...</h2>
                <p className="text-gray-500 mt-3 text-sm font-mono bg-gray-900 border border-gray-800 px-4 py-2 rounded-xl">Room ID: {roomId}</p>
            </div>
        );
    }

    return (
        <div className={`flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 text-white transition-transform duration-100 ${isShaking ? 'animate-shake' : ''}`}>
            
            {/* 커스텀 토스트 알림 컨테이너 (우측 상단 고정) */}
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

            <div className="flex gap-6 mb-8 w-full max-w-md justify-between bg-gray-900 border border-gray-800 p-4 rounded-2xl relative">
                {/* 플레이어 1 */}
                <div className="text-center flex-1">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Player 1 {role === 'player_1' ? "(나)" : "(상대)"}</p>
                    <p className="text-3xl font-black font-mono text-blue-400 mt-1">{scores.p1}</p>
                </div>
                <div className="flex flex-col items-center justify-center px-4">
                    <span className="text-[11px] bg-gradient-to-r from-red-500 to-amber-500 text-white px-4 py-1.5 rounded-full font-black tracking-widest shadow-md">
                        ⚡ TARGET: 1000
                    </span>
                </div>
                {/* 플레이어 2 */}
                <div className="text-center flex-1">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Player 2 {role === 'player_2' ? "(나)" : "(상대)"}</p>
                    <p className="text-3xl font-black font-mono text-red-400 mt-1">{scores.p2}</p>
                </div>
            </div>

            {quiz && (
                <div className="w-full max-w-2xl rounded-3xl bg-gray-900/90 p-8 border border-gray-800 shadow-2xl text-center relative overflow-hidden backdrop-blur-xs">
                    
                    {/* 뒤쪽에 호선 대표 컬러로 그라데이션 광원을 발사 */}
                    <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-20" style={{ backgroundColor: quiz.color_code }} />
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20" style={{ backgroundColor: quiz.color_code }} />

                    <div className="flex justify-center mb-6">
                        <span 
                            className="px-6 py-2 rounded-full font-black text-sm text-white tracking-widest shadow-lg transform hover:scale-105 transition-all"
                            style={{ backgroundColor: quiz.color_code }}
                        >
                            {quiz.line_name}
                        </span>
                    </div>

                    <div className="relative flex items-center justify-between w-full px-2 py-8 mb-8">
                        {/* 관통하는 노선선로 선 */}
                        <div className="absolute left-0 right-0 h-3 -z-10 rounded-full" style={{ backgroundColor: quiz.color_code, top: '42%' }} />
                        
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
                        
                        {/* 10초 이하 초성 힌트 오픈 시 보조 설명 */}
                        {timeLeft <= 10 && (
                            <p className="text-[10px] text-yellow-400/80 font-bold">💡 초성 첫 글자 오픈 찬스 활성화!</p>
                        )}
                    </div>
                </div>
            )}

            {/* 1000점 종료 시 표출되는 우승/패배 결과 대시보드 모달 */}
            {roomStatus === 'FINISHED' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-md p-4 animate-fade-in">
                    <div className={`w-full max-w-md rounded-3xl p-8 border shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center relative overflow-hidden backdrop-blur-md ${
                        isWinner 
                            ? 'bg-yellow-500/10 border-yellow-400/30 shadow-[0_0_40px_rgba(250,204,21,0.15)]' 
                            : 'bg-red-500/10 border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.15)]'
                    }`}>
                        
                        {/* 우승/패배 데코레이션 광원 */}
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

                        {/* 최종 누적 점수 디스플레이 */}
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

                        {/* 실시간 재경기 동의 현황 */}
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

                        {/* 제어 인터랙션 버튼 */}
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
        </div>
    );
}
