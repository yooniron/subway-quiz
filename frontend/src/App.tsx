import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Train, Send, Users } from 'lucide-react';
import confetti from 'canvas-confetti';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
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

    const startMatchmaking = async () => {
        const { data, error } = await supabase.rpc('join_or_create_room', { p_player_id: myId });
        if (error) return alert("매칭 에러: " + error.message);
        if (data && data.length > 0) {
            setRoomId(data[0].room_id);
            setRole(data[0].player_role as any);
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
                setScores({ p1: data.p1_score, p2: data.p2_score });
                
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
                    alert("상대방의 연결이 끊어져 게임이 종료되었습니다.");
                    await supabase.from('game_rooms').update({ status: 'FINISHED' }).eq('id', roomId);
                    
                    setRoomId(null);
                    setRoomStatus('WAITING');
                    setQuiz(null);
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
            alert("정답 제출 오류: " + error.message);
            return;
        }

        if (isCorrect) {
            confetti({ particleCount: 80, spread: 60 });
        } else {
            alert("틀렸습니다! 다시 입력해 보세요.");
            setUserInput('');
        }
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

    if (!roomId) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white font-sans px-4">
                <Train className="w-16 h-16 text-yellow-400 mb-6 animate-bounce"/>
                <h1 className="text-3xl font-extrabold mb-2">Subway Quiz</h1>
                <p className="text-gray-400 mb-8 text-center max-w-sm">실시간 지하철 노선 네트워크를 활용한 1대1 선착순 스피드 경쟁 플랫폼</p>
                <button 
                    onClick={startMatchmaking}
                    className="px-8 py-4 bg-yellow-400 hover:bg-yellow-500 text-gray-950 font-bold text-lg rounded-2xl shadow-lg transition-transform transform hover:scale-105"
                >
                    실시간 대전 매칭 시작
                </button>
            </div>
        );
    }

    if (roomStatus === 'WAITING') {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white px-4">
                <Users className="w-16 h-16 text-blue-400 mb-4 animate-pulse"/>
                <h2 className="text-2xl font-bold">상대 플레이어 대기 중...</h2>
                <p className="text-gray-500 mt-2 text-sm font-mono">Room ID: {roomId}</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 text-white">
            <div className="flex gap-6 mb-8 w-full max-w-md justify-between bg-gray-900 border border-gray-800 p-4 rounded-2xl">
                <div className="text-center">
                    <p className="text-xs text-gray-500">Player 1 {role === 'player_1' ? "(나)" : "(상대)"}</p>
                    <p className="text-2xl font-black font-mono text-blue-400">{scores.p1}</p>
                </div>
                <div className="flex flex-col items-center justify-center">
                    <span className="text-xs bg-yellow-400 text-gray-950 px-3 py-1 rounded-full font-bold animate-pulse">
                        ⚡ 선착순 스피드 경쟁!
                    </span>
                </div>
                <div className="text-center">
                    <p className="text-xs text-gray-500">Player 2 {role === 'player_2' ? "(나)" : "(상대)"}</p>
                    <p className="text-2xl font-black font-mono text-red-400">{scores.p2}</p>
                </div>
            </div>

            {quiz && (
                <div className="w-full max-w-2xl rounded-3xl bg-gray-900 p-8 border border-gray-800 shadow-2xl text-center">
                    <div className="flex justify-center mb-6">
                        <span 
                            className="px-6 py-2 rounded-full font-black text-sm text-white tracking-wider shadow-md"
                            style={{ backgroundColor: quiz.color_code }}
                        >
                            {quiz.line_name}
                        </span>
                    </div>

                    <div className="relative flex items-center justify-between w-full px-2 py-8 mb-8">
                        <div className="absolute left-0 right-0 h-3 -z-10 rounded-full" style={{ backgroundColor: quiz.color_code, top: '42%' }} />
                        
                        <div className={`flex flex-col items-center w-1/5 transition-all ${showL2 ? 'opacity-100' : 'opacity-20 blur-xs'}`}>
                            <div className="w-8 h-8 rounded-full border-4 border-white bg-gray-950" />
                            <span className="mt-2 text-xs font-bold">{showL2 ? quiz.left_2 : '?'}</span>
                        </div>
                        
                        <div className={`flex flex-col items-center w-1/5 transition-all ${showL1 ? 'opacity-100' : 'opacity-20 blur-xs'}`}>
                            <div className="w-8 h-8 rounded-full border-4 border-white bg-gray-950" />
                            <span className="mt-2 text-xs font-bold">{showL1 ? quiz.left_1 : '?'}</span>
                        </div>

                        <div className="flex flex-col items-center w-1/5">
                            <div className="w-12 h-12 rounded-full border-4 border-yellow-400 bg-white flex items-center justify-center animate-bounce">
                                <span className="text-gray-950 font-black text-sm">{getAnswerPlaceholder()}</span>
                            </div>
                            <span className="mt-2 text-xs font-bold text-yellow-400">[ 정답 ]</span>
                        </div>

                        <div className={`flex flex-col items-center w-1/5 transition-all ${showL1 ? 'opacity-100' : 'opacity-20 blur-xs'}`}>
                            <div className="w-8 h-8 rounded-full border-4 border-white bg-gray-950" />
                            <span className="mt-2 text-xs font-bold">{showL1 ? quiz.right_1 : '?'}</span>
                        </div>

                        <div className={`flex flex-col items-center w-1/5 transition-all ${showL2 ? 'opacity-100' : 'opacity-20 blur-xs'}`}>
                            <div className="w-8 h-8 rounded-full border-4 border-white bg-gray-950" />
                            <span className="mt-2 text-xs font-bold">{showL2 ? quiz.right_2 : '?'}</span>
                        </div>
                    </div>

                    <form onSubmit={handleAnswerSubmit} className="flex gap-2 max-w-sm mx-auto">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="먼저 정답을 입력하세요! ⚡"
                            className="flex-1 px-4 py-3 rounded-xl bg-gray-950 border border-gray-800 text-white focus:outline-none focus:border-yellow-400"
                        />
                        <button 
                            type="submit"
                            className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-950 font-bold rounded-xl transition-all"
                        >
                            <Send className="w-4 h-4"/>
                        </button>
                    </form>

                    <p className="mt-4 text-xs text-red-400 font-mono">⏱️ 다음 역 힌트 확장까지 남은 시간: {timeLeft}초</p>
                </div>
            )}
        </div>
    );
}
