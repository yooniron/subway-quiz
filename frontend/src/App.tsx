import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { supabase, generateUUID } from './lib/supabase';
import type { Quiz, RankingEntry, Toast, GameMode, PlayerRole, RoomStatus, LobbyRoom } from './types';
import { ToastContainer } from './components/common/ToastContainer';
import { LeaderboardModal } from './components/leaderboard/LeaderboardModal';
import { MainMenuPage } from './pages/MainMenuPage';
import { SingleGamePage } from './pages/SingleGamePage';
import { MultiplayerGamePage } from './pages/MultiplayerGamePage';
import { LobbyPage } from './pages/LobbyPage';
import { CreateRoomModal } from './components/common/CreateRoomModal';
import { RoomWaitingModal } from './components/common/RoomWaitingModal';
import { PasswordModal } from './components/common/PasswordModal';
import { InviteCodeModal } from './components/common/InviteCodeModal';
import { LineSelectorModal, SUBWAY_LINES } from './components/common/LineSelectorModal';

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
    const [isP2Connected, setIsP2Connected] = useState(false);
    const [isP2Ready, setIsP2Ready] = useState(false);
    const [currentRoomTitle, setCurrentRoomTitle] = useState('스피드 대전 방');
    const [currentInviteCode, setCurrentInviteCode] = useState<string | undefined>(undefined);

    // 모달 관리 상태 변수
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [targetPrivateRoom, setTargetPrivateRoom] = useState<LobbyRoom | null>(null);
    const [isInviteCodeModalOpen, setIsInviteCodeModalOpen] = useState(false);

    const [userInput, setUserInput] = useState('');
    const [timeLeft, setTimeLeft] = useState(30);

    // 실시간 대기실 이모지 상태 및 채널 레퍼런스
    const [p1Emoji, setP1Emoji] = useState<string | null>(null);
    const [p2Emoji, setP2Emoji] = useState<string | null>(null);
    const channelRef = useRef<any>(null);

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
    
    // 호선 선택 상태 관리 (기본값: 전체 1~9호선 선택)
    const [selectedLineIds, setSelectedLineIds] = useState<number[]>(() => SUBWAY_LINES.map(l => l.id));
    const [isLineSelectorOpen, setIsLineSelectorOpen] = useState(false);
    const [targetMode, setTargetMode] = useState<'SINGLE' | 'MULTIPLAYER' | null>(null);

    // 로비 관련 상태 변수들
    const [lobbies, setLobbies] = useState<LobbyRoom[]>([]);
    const [isLobbyLoading, setIsLobbyLoading] = useState(false);
    const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);

    // 인풋창 포커스 유지를 위한 ref
    const inputRef = useRef<HTMLInputElement | null>(null);

    // 실시간 퀴즈 ID 감지용 ref
    const prevQuizIdRef = useRef<number | null>(null);
    const scoresRef = useRef({ p1: 0, p2: 0 });
    const roleRef = useRef<PlayerRole>(role);
    const roomStatusRef = useRef<RoomStatus>(roomStatus);

    useEffect(() => {
        roleRef.current = role;
    }, [role]);

    useEffect(() => {
        roomStatusRef.current = roomStatus;
    }, [roomStatus]);

    const focusInput = () => {
        setTimeout(() => {
            inputRef.current?.focus();
        }, 30);
    };

    useEffect(() => {
        scoresRef.current = scores;
    }, [scores]);

    // 실시간 대전 유령 방 방지용 백그라운드 핑(Ping) 헬스체크
    useEffect(() => {
        if (!roomId || gameMode !== 'MULTIPLAYER') return;

        const pingInterval = setInterval(async () => {
            try {
                await supabase
                    .from('game_rooms')
                    .update({ last_ping_at: new Date().toISOString() })
                    .eq('id', roomId);
            } catch (e) {
                // 핑 실패 예외 방어
            }
        }, 10000);

        return () => clearInterval(pingInterval);
    }, [roomId, gameMode]);

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

    const fetchLeaderboard = async (lineId: number | null = null) => {
        try {
            const { data, error } = await supabase.rpc('get_rankings_by_line', {
                p_line_id: lineId
            });

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

    const fetchLobbies = async () => {
        setIsLobbyLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_active_lobbies');
            if (error) {
                showToast('error', "로비 방 목록을 가져오지 못했습니다.");
            } else if (data) {
                setLobbies(data);
            }
        } catch (e: any) {
            showToast('error', "로비 목록 로딩 예외가 발생했습니다.");
        } finally {
            setIsLobbyLoading(false);
        }
    };

    // 로비 진입 시 실시간 변경 구독 및 주기적 자가치유 리프레시
    useEffect(() => {
        if (gameMode !== 'LOBBY') return;
        fetchLobbies();

        const channel = supabase
            .channel('lobby_realtime_channel')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'game_rooms'
            }, () => {
                fetchLobbies();
            })
            .subscribe();

        const refetchInterval = setInterval(() => {
            fetchLobbies();
        }, 15000); // 15초마다 주기적으로 로비 목록을 조회하여 유령 방을 청소/갱신

        return () => {
            clearInterval(refetchInterval);
            supabase.removeChannel(channel);
        };
    }, [gameMode]);

    const handleCreateCustomRoom = async (
        roomTitle: string,
        lines: number[],
        isPrivate: boolean = false,
        password?: string
    ) => {
        try {
            setGameMode('MULTIPLAYER');
            setRoomStatus('WAITING');
            const { data, error } = await supabase.rpc('create_custom_room', {
                p_player_id: myId,
                p_room_title: roomTitle,
                p_selected_line_ids: lines,
                p_is_private: isPrivate,
                p_password: password
            });
            if (error) {
                showToast('error', "맞춤 방 생성 에러: " + error.message);
                await handleExitRoom();
                return;
            }
            if (data && data.length > 0) {
                setRoomId(data[0].room_id);
                setRole(data[0].player_role as any);
                if (data[0].invite_code) {
                    setCurrentInviteCode(data[0].invite_code);
                }
                const privacyText = isPrivate ? "🔒 비공개" : "🌐 공개";
                showToast('success', `'${roomTitle}' (${privacyText}) 방을 개설하였습니다!`);
            }
        } catch (e: any) {
            showToast('error', "방 생성 중 예외가 발생했습니다.");
            await handleExitRoom();
        }
    };

    const handleJoinPrivateRoom = (room: LobbyRoom) => {
        setTargetPrivateRoom(room);
        setIsPasswordModalOpen(true);
    };

    const handleConfirmPasswordJoin = async (password: string) => {
        if (!targetPrivateRoom) return;
        try {
            const { data: isValid, error } = await supabase.rpc('verify_room_password', {
                p_room_id: targetPrivateRoom.id,
                p_password: password
            });
            if (error) {
                showToast('error', "비밀번호 검증 중 오류: " + error.message);
                return;
            }
            if (!isValid) {
                showToast('error', "🔒 방 비밀번호가 일치하지 않습니다.");
                return;
            }

            setIsPasswordModalOpen(false);
            const targetId = targetPrivateRoom.id;
            setTargetPrivateRoom(null);
            await handleJoinRoomById(targetId);
        } catch (e: any) {
            showToast('error', "비밀번호 확인 중 예외가 발생했습니다.");
        }
    };

    const handleJoinByInviteCode = async (code: string) => {
        try {
            const { data, error } = await supabase.rpc('join_room_by_code', {
                p_invite_code: code,
                p_player_id: myId
            });
            if (error) {
                showToast('error', "초대코드 입장 실패: " + error.message);
                return;
            }
            if (data && data.length > 0) {
                const roomInfo = data[0];
                setIsInviteCodeModalOpen(false);

                if (roomInfo.has_password || roomInfo.is_private) {
                    // 비밀번호 방이면 비밀번호 입력 모달로 전환
                    setTargetPrivateRoom({
                        id: roomInfo.room_id,
                        room_title: '초대 코드 대전방',
                        player_1: '',
                        player_2: null,
                        status: 'WAITING',
                        selected_line_ids: null,
                        player_count: 1,
                        created_at: new Date().toISOString(),
                        is_private: true,
                        has_password: true
                    });
                    setIsPasswordModalOpen(true);
                } else {
                    await handleJoinRoomById(roomInfo.room_id);
                }
            }
        } catch (e: any) {
            showToast('error', "초대코드 처리 중 예외가 발생했습니다.");
        }
    };

    const handleJoinRoomById = async (targetRoomId: string) => {
        try {
            setGameMode('MULTIPLAYER');
            setRoomStatus('WAITING');
            const { data, error } = await supabase.rpc('join_room_by_id', {
                p_room_id: targetRoomId,
                p_player_id: myId
            });
            if (error) {
                showToast('error', "방 입장 실패: " + error.message);
                await handleExitRoom();
                return;
            }
            if (data && data.length > 0) {
                setRoomId(data[0].room_id);
                setRole(data[0].player_role as any);
                showToast('success', "대전 방에 입장하였습니다!");
            }
        } catch (e: any) {
            showToast('error', "방 입장 중 예외가 발생했습니다.");
            await handleExitRoom();
        }
    };

    const handleOpenLineSelectorWithMode = (mode: 'SINGLE' | 'MULTIPLAYER') => {
        if (mode === 'MULTIPLAYER') {
            setGameMode('LOBBY');
        } else {
            setTargetMode(mode);
            setIsLineSelectorOpen(true);
        }
    };

    const handleConfirmStart = (lines: number[]) => {
        setSelectedLineIds(lines);
        if (targetMode === 'SINGLE') {
            startSingleModeWithLines(lines);
        } else if (targetMode === 'MULTIPLAYER') {
            startMatchmakingWithLines(lines);
        }
    };

    const handleToggleReady = async () => {
        if (!roomId) return;
        try {
            const { error } = await supabase.rpc('toggle_player_ready', {
                p_room_id: roomId,
                p_player_id: myId
            });
            if (error) {
                showToast('error', "READY 준비 상태 변경 실패: " + error.message);
            }
        } catch (e: any) {
            showToast('error', "READY 상태 변경 중 오류가 발생했습니다.");
        }
    };

    const handleStartGameByHost = async () => {
        if (!roomId || role !== 'player_1') return;
        try {
            const { data, error } = await supabase.rpc('start_game_by_host', {
                p_room_id: roomId,
                p_player_id: myId
            });
            if (error || !data) {
                showToast('error', "게임 시작 오류가 발생했습니다.");
            } else {
                showToast('success', "🚀 퀴즈 대전이 시작되었습니다!");
            }
        } catch (e: any) {
            showToast('error', "게임 시작 중 오류가 발생했습니다.");
        }
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
            setIsP2Connected(false);
            setIsP2Ready(false);
            setCurrentInviteCode(undefined);
            setGameMode('MENU');
        }
    };

    const startMatchmakingWithLines = async (lines: number[]) => {
        try {
            setGameMode('MULTIPLAYER');
            setRoomStatus('WAITING');
            const { data, error } = await supabase.rpc('join_or_create_room', { 
                p_player_id: myId,
                p_selected_line_ids: lines 
            });
            if (error) {
                showToast('error', "매칭 에러: " + error.message);
                await handleExitRoom();
                return;
            }
            if (data && data.length > 0) {
                setRoomId(data[0].room_id);
                setRole(data[0].player_role as any);
                showToast('info', `🎯 지정된 호선(${lines.length}개) 1대1 매칭 탐색을 시작합니다...`);
            } else {
                showToast('error', "방 생성을 실패하였습니다. 다시 시도해 주세요.");
                await handleExitRoom();
            }
        } catch (e: any) {
            showToast('error', "매칭 중 예외가 발생하여 메인 메뉴로 복귀합니다.");
            await handleExitRoom();
        }
    };

    const startSingleModeWithLines = (lines: number[]) => {
        setGameMode('SINGLE');
        setSingleScore(0);
        setSingleTimeLeft(60);
        setComboCount(0);
        setHintCount(3);
        setIsHintActive(false);
        setIsSingleOver(false);
        setIsRankSubmitted(false);
        setUserInput('');
        loadSingleQuiz(lines);
    };

    const loadSingleQuiz = async (lines: number[] = selectedLineIds) => {
        try {
            const { data, error } = await supabase.rpc('get_single_quiz', {
                p_selected_line_ids: lines
            });
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

            loadSingleQuiz(selectedLineIds);
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

        // 호선 요약 문구 생성
        let lineSummary = '전체(1~9호선)';
        if (selectedLineIds.length === 1) {
            lineSummary = `${selectedLineIds[0]}호선`;
        } else if (selectedLineIds.length < SUBWAY_LINES.length) {
            lineSummary = selectedLineIds.map(id => `${id}호선`).join(',');
        }

        try {
            const { error } = await supabase.from('rankings').insert({
                player_id: myId,
                nickname: cleanNick,
                score: singleScore,
                line_ids: selectedLineIds,
                line_summary: lineSummary
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
                setIsP2Connected(!!data.player_2);
                setIsP2Ready(data.p2_ready || false);
                setCurrentRoomTitle(data.room_title || '스피드 대전 방');
                if (data.invite_code) {
                    setCurrentInviteCode(data.invite_code);
                }

                if (data.status === 'PLAYING' && data.quiz_target_id) {
                    if (data.quiz_target_id !== prevQuizIdRef.current) {
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
                if (!data) return;

                // 1) 방장이 나가서 내가 새 방장으로 승격된 경우 (Host Migration)
                if (data.player_1 === myId && roleRef.current !== 'player_1') {
                    setRole('player_1');
                    showToast('info', "👑 기존 방장이 퇴장하여 당신이 새로운 방장으로 지정되었습니다!");
                }

                // 2) 참가자(Player 2)가 나간 경우
                if (!data.player_2 && roleRef.current === 'player_1' && isP2Connected) {
                    showToast('info', "ℹ️ 상대 플레이어가 대기실을 퇴장했습니다.");
                }

                // 3) 대기방이 완전 파기되었거나 대전 진행 중 한 명이 기권/이탈한 경우 (CANCELLED)
                if (data.status === 'CANCELLED') {
                    if (roomStatus === 'PLAYING') {
                        showToast('error', "⚠️ 상대 플레이어가 대전을 기권(이탈)하여 대전이 종료되었습니다.");
                    } else {
                        showToast('error', "📢 대기방이 파기되었습니다.");
                    }
                    await handleExitRoom();
                    return;
                }

                setRoomStatus(data.status);
                setIsP2Connected(!!data.player_2);
                setIsP2Ready(data.p2_ready || false);
                setCurrentRoomTitle(data.room_title || '스피드 대전 방');
                if (data.invite_code) {
                    setCurrentInviteCode(data.invite_code);
                }
                
                const prevP1 = scoresRef.current.p1;
                const prevP2 = scoresRef.current.p2;

                const isP1 = role === 'player_1' || data.player_1 === myId;
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

                if (data.status === 'PLAYING' && data.quiz_target_id) {
                    if (data.quiz_target_id !== prevQuizIdRef.current) {
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
            })
            .on('broadcast', { event: 'emoji' }, ({ payload }) => {
                const { emoji, senderId } = payload;
                if (senderId !== myId) {
                    const isOpponentP1 = roleRef.current === 'player_2';
                    if (isOpponentP1) {
                        setP1Emoji(emoji);
                        setTimeout(() => setP1Emoji(null), 1500);
                    } else {
                        setP2Emoji(emoji);
                        setTimeout(() => setP2Emoji(null), 1500);
                    }
                }
            })
            .on('presence', { event: 'leave' }, async ({ key }) => {
                // 대전 중(PLAYING) 또는 종료 후 재경기 대기 중(FINISHED)일 때 상대가 방을 완전히 이탈한 경우
                if (roomStatusRef.current === 'PLAYING' || roomStatusRef.current === 'FINISHED') {
                    showToast('error', "상대방이 방을 퇴장하여 대전 세션이 종료되었습니다.");
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

        channelRef.current = channel;

        const handleBeforeUnload = () => {
            if (roomId) {
                // keepalive fetch를 통해 브라우저 탭 종료 시에도 인증 헤더를 실어 동기 퇴장 처리 보장
                const url = `${supabase.supabaseUrl}/rest/v1/rpc/exit_room`;
                fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': supabase.supabaseKey,
                        'Authorization': `Bearer ${supabase.supabaseKey}`
                    },
                    body: JSON.stringify({ p_room_id: roomId, p_player_id: myId }),
                    keepalive: true
                }).catch(() => {});
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handleBeforeUnload);
            supabase.removeChannel(channel);
            channelRef.current = null;
        };
    }, [roomId, gameMode, myId]);

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

    const sendEmoji = (emoji: string) => {
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'emoji',
                payload: { emoji, senderId: myId }
            });
            // 로컬에서도 즉시 트리거
            if (role === 'player_1') {
                setP1Emoji(emoji);
                setTimeout(() => setP1Emoji(null), 1500);
            } else {
                setP2Emoji(emoji);
                setTimeout(() => setP2Emoji(null), 1500);
            }
        }
    };

    // 30초 스피드 대전 힌트 공개 플래그 (양끝 2단계 역 선공개 ➡️ 10초 뒤 직접 인접역 후공개)
    const showL2 = true;                   // 1단계: 양끝 2단계 역(left_2, right_2)은 0초부터 항상 선공개
    const showL1 = timeLeft <= 20;         // 2단계: 10초 경과(남은시간 20초 이하) 시 직접 인접역(left_1, right_1) 언락
    const showHintChar = timeLeft <= 10;   // 3단계: 20초 경과(남은시간 10초 이하) 시 정답 초성 힌트 언락

    return (
        <>
            <ToastContainer toasts={toasts} />
            <LeaderboardModal 
                isOpen={isLeaderboardOpen}
                onClose={() => setIsLeaderboardOpen(false)}
                rankingsList={rankingsList}
                myId={myId}
                onFetchByLine={(lineId) => fetchLeaderboard(lineId)}
            />

            <LineSelectorModal 
                isOpen={isLineSelectorOpen}
                onClose={() => setIsLineSelectorOpen(false)}
                selectedLineIds={selectedLineIds}
                onSelectLines={(lines) => setSelectedLineIds(lines)}
                onConfirmStart={(lines) => handleConfirmStart(lines)}
                targetMode={targetMode}
            />

            <CreateRoomModal 
                isOpen={isCreateRoomOpen}
                onClose={() => setIsCreateRoomOpen(false)}
                onCreateRoom={handleCreateCustomRoom}
            />

            <PasswordModal 
                isOpen={isPasswordModalOpen}
                roomTitle={targetPrivateRoom?.room_title || '비공개 대전방'}
                onClose={() => {
                    setIsPasswordModalOpen(false);
                    setTargetPrivateRoom(null);
                }}
                onConfirm={handleConfirmPasswordJoin}
            />

            <InviteCodeModal 
                isOpen={isInviteCodeModalOpen}
                onClose={() => setIsInviteCodeModalOpen(false)}
                onJoinByCode={handleJoinByInviteCode}
            />

            {gameMode === 'MENU' && (
                <MainMenuPage 
                    onFetchLeaderboard={() => fetchLeaderboard(null)}
                    selectedLineIds={selectedLineIds}
                    onOpenLineSelectorWithMode={handleOpenLineSelectorWithMode}
                />
            )}

            {gameMode === 'LOBBY' && (
                <LobbyPage 
                    lobbies={lobbies}
                    isLoading={isLobbyLoading}
                    onRefresh={fetchLobbies}
                    onQuickMatch={() => startMatchmakingWithLines(selectedLineIds)}
                    onOpenCreateRoom={() => setIsCreateRoomOpen(true)}
                    onOpenInviteCodeModal={() => setIsInviteCodeModalOpen(true)}
                    onJoinRoom={handleJoinRoomById}
                    onJoinPrivateRoom={handleJoinPrivateRoom}
                    onBackToMenu={() => setGameMode('MENU')}
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
                    onRestart={() => startSingleModeWithLines(selectedLineIds)}
                    onNicknameChange={(e) => setNicknameInput(e.target.value)}
                    onSubmitRanking={submitSingleRanking}
                    onOpenLeaderboard={fetchLeaderboard}
                />
            )}

            {gameMode === 'MULTIPLAYER' && (
                <div className="min-h-screen bg-gray-950 text-white font-sans relative overflow-x-hidden">
                    {roomStatus === 'WAITING' && roomId && (
                        <RoomWaitingModal 
                            roomId={roomId}
                            roomTitle={currentRoomTitle}
                            selectedLineIds={selectedLineIds}
                            inviteCode={currentInviteCode}
                            role={role}
                            isP2Connected={isP2Connected}
                            isP2Ready={isP2Ready}
                            onToggleReady={handleToggleReady}
                            onStartGame={handleStartGameByHost}
                            onExitRoom={handleExitRoom}
                            showToast={showToast}
                            p1Emoji={p1Emoji}
                            p2Emoji={p2Emoji}
                            onSendEmoji={sendEmoji}
                        />
                    )}

                    {roomStatus !== 'WAITING' && (
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
                </div>
            )}
        </>
    );
}
