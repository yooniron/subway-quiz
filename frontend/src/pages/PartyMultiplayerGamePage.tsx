import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Send, Trophy, Flame, Lock, MessageSquare, Clock, Zap, Award, ArrowLeft, Volume2 } from 'lucide-react';
import type { Quiz } from '../types';
import type { PartyPlayer, PartyChatMessage } from '../utils/partyRoom';
import { calculatePartyScore, formatSpoilerFreeNotice, sortPartyPlayers } from '../utils/partyRoom';
import { playCorrectSound, playWrongSound, playVictorySound } from '../lib/sound';
import { getChoseong } from '../utils/hangul';

import { usePartyRoomChannel } from '../hooks/usePartyRoomChannel';

interface PartyMultiplayerGamePageProps {
    currentUserId: string;
    currentUserNickname: string;
    equippedTitle?: string | null;
    inviteCode?: string | null;
    initialPlayers: PartyPlayer[];
    quizList: Quiz[];
    onExitGame: () => void;
}

export const PartyMultiplayerGamePage: React.FC<PartyMultiplayerGamePageProps> = ({
    currentUserId,
    currentUserNickname,
    equippedTitle,
    inviteCode,
    initialPlayers,
    quizList,
    onExitGame
}) => {
    // 8인 플레이어 상태
    const [players, setPlayers] = useState<PartyPlayer[]>(initialPlayers);
    const [currentRound, setCurrentRound] = useState<number>(1);
    const totalRounds = Math.min(10, quizList.length);

    const currentQuiz = quizList[currentRound - 1] || null;

    // 라운드 타이머 및 힌트 상태 (라운드당 여유 있는 45초 지원!)
    const [timeLeft, setTimeLeft] = useState<number>(45);
    const [userInput, setUserInput] = useState<string>('');
    const [broadcastNotice, setBroadcastNotice] = useState<string | null>(null);

    // 시크릿 채팅 상태
    const [chatMessages, setChatMessages] = useState<PartyChatMessage[]>([]);
    const [chatInput, setChatInput] = useState<string>('');

    // 시상식 최종 상태
    const [isFinished, setIsFinished] = useState<boolean>(false);

    const {
        broadcastSubmitAnswer,
        broadcastSecretChat
    } = usePartyRoomChannel({
        inviteCode: inviteCode || null,
        currentUserId,
        currentUserNickname,
        equippedTitle,
        onAnswerSubmitted: (payload) => {
            if (payload.playerId === currentUserId) return;
            setPlayers(prev => {
                const next = prev.map(p => {
                    if (p.id === payload.playerId) {
                        return {
                            ...p,
                            score: p.score + payload.earnedScore,
                            combo: p.combo + 1,
                            hasAnswered: true,
                            rank: payload.rank
                        };
                    }
                    return p;
                });
                return sortPartyPlayers(next);
            });
            const notice = formatSpoilerFreeNotice(payload.nickname, payload.rank, payload.earnedScore);
            setBroadcastNotice(notice);
            setTimeout(() => setBroadcastNotice(null), 3000);
        },
        onSecretChatReceived: (msg) => {
            setChatMessages(prev => {
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
        },
        onPlayerLeft: (leftPlayerId) => {
            setPlayers(prev => prev.filter(p => p.id !== leftPlayerId));
        }
    });

    const currentMe = players.find(p => p.id === currentUserId);
    const hasCurrentMeAnswered = currentMe?.hasAnswered || false;

    // 힌트 자동 개방 단계 (양끝 2단계 역은 0초부터 항상 선공개!)
    const showL2Hint = true;
    const showL1Hint = timeLeft <= 30;   // 15초 경과 시 L1 인접역 해금
    const showHintChar = timeLeft <= 15; // 30초 경과 시 초성 힌트 해금

    // 라운드 변경 시 초기화
    useEffect(() => {
        setTimeLeft(45);
        setUserInput('');
        setBroadcastNotice(null);
        setPlayers(prev => prev.map(p => ({ ...p, hasAnswered: false, finishTimeMs: undefined })));
    }, [currentRound]);

    // 라운드 타이머 카운트다운
    useEffect(() => {
        if (isFinished || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleRoundTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, isFinished, currentRound]);

    // 전원 정답 맞혔는지 체크
    useEffect(() => {
        if (isFinished || players.length === 0) return;
        const allAnswered = players.every(p => p.hasAnswered);
        if (allAnswered && timeLeft > 0) {
            handleRoundTimeout();
        }
    }, [players]);

    // 라운드 종료 / 시간 초과 처리
    const handleRoundTimeout = () => {
        setTimeout(() => {
            if (currentRound < totalRounds) {
                setCurrentRound(prev => prev + 1);
            } else {
                setIsFinished(true);
                playVictorySound();
                confetti({ particleCount: 100, spread: 80 });
            }
        }, 2000);
    };

    // 정답 제출 핸들러
    const handleAnswerSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentQuiz || hasCurrentMeAnswered || isFinished) return;

        const cleanInput = userInput.trim().replace(/역$/, '');
        const cleanTarget = currentQuiz.target_station_name.replace(/역$/, '');

        if (cleanInput === cleanTarget) {
            playCorrectSound();

            // 순위 계산 (이미 맞힌 인원 수 + 1)
            const answeredCount = players.filter(p => p.hasAnswered).length;
            const myRank = answeredCount + 1;
            const responseTimeMs = (45 - timeLeft) * 1000;
            const earnedScore = calculatePartyScore(myRank, responseTimeMs);

            // 내 상태 갱신
            setPlayers(prev => {
                const next = prev.map(p => {
                    if (p.id === currentUserId) {
                        return {
                            ...p,
                            score: p.score + earnedScore,
                            combo: p.combo + 1,
                            hasAnswered: true,
                            rank: myRank
                        };
                    }
                    return p;
                });
                return sortPartyPlayers(next);
            });

            // 소켓으로 타 플레이어에게 정답 브로드캐스트 전파
            broadcastSubmitAnswer({
                playerId: currentUserId,
                nickname: currentUserNickname,
                rank: myRank,
                earnedScore,
                round: currentRound
            });

            // 스포일러 방지 방송 알림 표출 (역 이름 0% 노출)
            const notice = formatSpoilerFreeNotice(currentUserNickname, myRank, earnedScore);
            setBroadcastNotice(notice);
            setTimeout(() => setBroadcastNotice(null), 3000);

            // 시크릿 채팅 자동 안내 수신
            const systemMsg: PartyChatMessage = {
                id: 'sys_' + Date.now(),
                senderId: 'SYSTEM',
                senderNickname: '시크릿 알림',
                text: `🎉 [${currentUserNickname}]님이 ${myRank}등으로 정답을 맞히고 시크릿 채널에 입장하셨습니다!`,
                type: 'text',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setChatMessages(prev => [...prev, systemMsg]);

        } else {
            playWrongSound();
            alert('틀렸습니다! 다시 생각해 보세요.');
            setUserInput('');
        }
    };

    // 시크릿 채팅 전송 (텍스트 / 퀵멘트 / 이모지)
    const sendChatMessage = (textToSend?: string, type: 'text' | 'preset' | 'emoji' = 'text') => {
        const msgText = textToSend || chatInput.trim();
        if (!msgText || !hasCurrentMeAnswered) return;

        const newMsg: PartyChatMessage = {
            id: 'msg_' + Date.now(),
            senderId: currentUserId,
            senderNickname: currentUserNickname,
            text: msgText,
            type,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setChatMessages(prev => [...prev, newMsg]);
        broadcastSecretChat(newMsg);
        if (!textToSend) setChatInput('');
    };

    // 최종 10라운드 시상식 포디움 UI
    if (isFinished) {
        const sortedFinal = sortPartyPlayers(players);
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 text-white font-sans">
                <div className="w-full max-w-xl bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl text-center animate-card-pop">
                    <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-bounce" />
                    <h1 className="text-3xl font-black mb-2">🎉 파티 대전 최종 시상식!</h1>
                    <p className="text-gray-400 text-sm mb-6">총 10라운드 서바이벌 대전이 완료되었습니다.</p>

                    <div className="space-y-3 mb-8">
                        {sortedFinal.map((p, idx) => (
                            <div
                                key={p.id}
                                className={`p-4 rounded-2xl border flex items-center justify-between ${
                                    idx === 0
                                        ? 'bg-yellow-400/10 border-yellow-400/50 text-yellow-300'
                                        : idx === 1
                                        ? 'bg-gray-300/10 border-gray-400/40 text-gray-200'
                                        : idx === 2
                                        ? 'bg-amber-600/10 border-amber-600/40 text-amber-300'
                                        : 'bg-gray-950 border-gray-800 text-gray-400'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center ${
                                        idx === 0 ? 'bg-yellow-400 text-gray-950' : idx === 1 ? 'bg-gray-300 text-gray-950' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-400'
                                    }`}>
                                        {idx + 1}
                                    </span>
                                    <div className="text-left">
                                        <p className="font-black text-sm">{p.nickname}</p>
                                        {p.equippedTitle && <p className="text-[11px] font-bold opacity-80">✨ {p.equippedTitle}</p>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono font-black text-lg">{p.score} <span className="text-xs">pts</span></p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={onExitGame}
                        className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 text-gray-950 font-black text-lg rounded-2xl shadow-lg transition-transform transform active:scale-95 cursor-pointer"
                    >
                        메인 메뉴로 이동
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-between bg-gray-950 px-4 py-6 text-white font-sans">
            {/* 상단 8인 실시간 라이브 스코어바 */}
            <div className="w-full max-w-3xl bg-gray-900 border border-gray-800 rounded-2xl p-3 mb-4 shadow-xl">
                <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs font-black text-gray-300">8인 라이브 순위표</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 px-2.5 py-0.5 rounded-full">
                        Round {currentRound} / {totalRounds}
                    </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {players.map((p, idx) => (
                        <div
                            key={p.id}
                            className={`p-2 rounded-xl border text-center transition-all ${
                                p.id === currentUserId
                                    ? 'bg-indigo-950/60 border-indigo-500/60'
                                    : 'bg-gray-950/80 border-gray-800'
                            }`}
                        >
                            <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                                <span className="font-bold">#{idx + 1}</span>
                                {p.hasAnswered && (
                                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1 rounded">
                                        🔒 통과
                                    </span>
                                )}
                            </div>
                            <p className="text-xs font-black truncate text-white">{p.nickname}</p>
                            <p className="text-xs font-mono font-bold text-yellow-400 mt-0.5">{p.score}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* 스포일러 차단 방송 알림 팝업 */}
            {broadcastNotice && (
                <div className="w-full max-w-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950 px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm text-center shadow-lg animate-bounce mb-2">
                    {broadcastNotice}
                </div>
            )}

            {/* 메인 퀴즈 카드 */}
            {currentQuiz && (
                <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative mb-4">
                    <div className="flex justify-between items-center mb-4">
                        <span
                            className="px-5 py-1.5 rounded-full font-black text-xs text-white shadow-md"
                            style={{ backgroundColor: currentQuiz.color_code }}
                        >
                            {currentQuiz.line_name}
                        </span>
                        <div className="flex items-center gap-1.5 bg-gray-950 border border-gray-800 px-3 py-1 rounded-full text-xs font-mono font-bold text-red-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{timeLeft}초</span>
                        </div>
                    </div>

                    {/* 노선도 인접역 힌트 시각화 */}
                    <div className="relative flex items-center justify-between w-full px-2 py-6 mb-6">
                        <div className="absolute left-0 right-0 h-2.5 -z-10 rounded-full" style={{ backgroundColor: currentQuiz.color_code, top: '42%' }} />

                        <div className={`flex flex-col items-center w-1/5 transition-all ${showL2Hint ? 'opacity-100' : 'opacity-20 blur-xs'}`}>
                            <div className="w-7 h-7 rounded-full border-3 border-white bg-gray-950" />
                            <span className="mt-2 text-[11px] font-bold">{showL2Hint ? currentQuiz.left_2 : '?'}</span>
                        </div>

                        <div className={`flex flex-col items-center w-1/5 transition-all ${showL1Hint ? 'opacity-100' : 'opacity-20 blur-xs'}`}>
                            <div className="w-7 h-7 rounded-full border-3 border-white bg-gray-950" />
                            <span className="mt-2 text-[11px] font-bold">{showL1Hint ? currentQuiz.left_1 : '?'}</span>
                        </div>

                        <div className="flex flex-col items-center w-1/5">
                            <div className="w-11 h-11 rounded-full border-4 border-yellow-400 bg-white flex items-center justify-center animate-pulse shadow-md">
                                <span className="text-gray-950 font-black text-base">
                                    {showHintChar ? getChoseong(currentQuiz.target_station_name) : '?'}
                                </span>
                            </div>
                            <span className="mt-1.5 text-xs font-black text-yellow-400">
                                {showHintChar ? '💡 초성 힌트' : '[ 정답 입력 ]'}
                            </span>
                        </div>

                        <div className={`flex flex-col items-center w-1/5 transition-all ${showL1Hint ? 'opacity-100' : 'opacity-20 blur-xs'}`}>
                            <div className="w-7 h-7 rounded-full border-3 border-white bg-gray-950" />
                            <span className="mt-2 text-[11px] font-bold">{showL1Hint ? currentQuiz.right_1 : '?'}</span>
                        </div>

                        <div className={`flex flex-col items-center w-1/5 transition-all ${showL2Hint ? 'opacity-100' : 'opacity-20 blur-xs'}`}>
                            <div className="w-7 h-7 rounded-full border-3 border-white bg-gray-950" />
                            <span className="mt-2 text-[11px] font-bold">{showL2Hint ? currentQuiz.right_2 : '?'}</span>
                        </div>
                    </div>

                    {/* 정답 입력 폼 */}
                    <form onSubmit={handleAnswerSubmit} className="flex gap-2 max-w-md mx-auto">
                        <input
                            type="text"
                            disabled={hasCurrentMeAnswered}
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder={hasCurrentMeAnswered ? "🔒 이미 이 라운드를 통과하셨습니다! (시크릿 채팅을 이용해 보세요)" : "정답 입력..."}
                            className="flex-1 px-4 py-3 rounded-xl bg-gray-950 border border-gray-800 text-white focus:outline-none focus:border-yellow-400 disabled:opacity-50 text-sm"
                        />
                        <button
                            type="submit"
                            disabled={hasCurrentMeAnswered}
                            className="px-5 py-3 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-800 text-gray-950 font-bold rounded-xl transition-all cursor-pointer"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            )}

            {/* 🔒 정답자 전용 시크릿 채팅방 (Secret Solvers Chat) */}
            <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-3xl p-4 sm:p-5 shadow-2xl">
                <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-black text-gray-200">🔒 정답자 시크릿 채팅방</span>
                    </div>
                    {hasCurrentMeAnswered ? (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                            🟢 시크릿 채널 접속됨
                        </span>
                    ) : (
                        <span className="text-[10px] bg-gray-800 text-gray-400 border border-gray-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" /> 정답 입력 후 잠금 해제
                        </span>
                    )}
                </div>

                {/* 채팅 메시지 스크롤 박스 */}
                <div className="h-28 overflow-y-auto bg-gray-950/80 border border-gray-800/80 rounded-xl p-3 mb-3 space-y-2 text-xs">
                    {!hasCurrentMeAnswered ? (
                        <div className="h-full flex items-center justify-center text-gray-500 text-xs font-bold text-center">
                            🔒 정답을 맞히면 이곳에서 정답자들끼리 비밀 채팅을 나눌 수 있습니다!
                        </div>
                    ) : chatMessages.length === 0 ? (
                        <div className="text-gray-500 text-xs text-center py-4">
                            아직 시크릿 채팅이 없습니다. 가장 먼저 메시지를 남겨보세요!
                        </div>
                    ) : (
                        chatMessages.map(msg => (
                            <div key={msg.id} className="flex items-start gap-2">
                                <span className="font-bold text-yellow-400 shrink-0">[{msg.senderNickname}]:</span>
                                <span className="text-gray-200 break-all">{msg.text}</span>
                            </div>
                        ))
                    )}
                </div>

                {/* 퀵메뉴 & 이모지 버튼바 (2-A + 2-B) */}
                {hasCurrentMeAnswered && (
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <div className="flex gap-1">
                                {['쉬운데?', '다 와간다!', '힘내라!', '오답 ㅋㅋㅋ'].map(preset => (
                                    <button
                                        key={preset}
                                        onClick={() => sendChatMessage(preset, 'preset')}
                                        className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-[10px] font-bold text-gray-300 rounded-lg transition-all"
                                    >
                                        {preset}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-1">
                                {['😂', '🔥', '👏', '🤫', '🤐'].map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => sendChatMessage(emoji, 'emoji')}
                                        className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-xs rounded-lg transition-all transform hover:scale-110"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 시크릿 자유 텍스트 전송 */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                                placeholder="정답자 전용 비밀 메시지..."
                                className="flex-1 px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white focus:outline-none focus:border-emerald-400 text-xs"
                            />
                            <button
                                onClick={() => sendChatMessage()}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
                            >
                                전송
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
