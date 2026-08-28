import React, { useState } from 'react';
import { X, Users, Crown, CheckCircle2, Clock, Copy, Play, Lock, ShieldCheck } from 'lucide-react';
import type { PartyPlayer, PartyRoomState } from '../../utils/partyRoom';
import { SUBWAY_LINES } from '../common/LineSelectorModal';

interface PartyRoomWaitingModalProps {
    isOpen: boolean;
    onClose: () => void;
    roomState: PartyRoomState;
    currentUserId: string;
    onToggleReady: () => void;
    onStartGame: () => void;
    onCopyInviteCode: () => void;
}

export const PartyRoomWaitingModal: React.FC<PartyRoomWaitingModalProps> = ({
    isOpen,
    onClose,
    roomState,
    currentUserId,
    onToggleReady,
    onStartGame,
    onCopyInviteCode
}) => {
    const [copiedToast, setCopiedToast] = useState(false);

    if (!isOpen) return null;

    const me = roomState.players.find(p => p.id === currentUserId);
    const isHost = me?.isHost || false;
    const canStart = roomState.players.length >= 2 && roomState.players.every(p => p.isHost || p.isReady);

    const handleCopy = () => {
        onCopyInviteCode();
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 2000);
    };

    // 8개 슬롯 배열 생성
    const totalSlots = Array.from({ length: 8 }, (_, i) => roomState.players[i] || null);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md animate-fade-in font-sans">
            <div className="relative w-full max-w-2xl max-h-[90vh] bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 overflow-y-auto shadow-2xl text-white">
                {/* 닫기 / 나가기 버튼 */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-all"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* 모달 헤더 */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl sm:text-2xl font-black">{roomState.title}</h2>
                            {roomState.isPrivate && (
                                <span className="px-2 py-0.5 text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full flex items-center gap-1">
                                    <Lock className="w-3 h-3" /> 비공개
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 font-bold mt-1">
                            실시간 8인 서바이벌 다인전 대기실 • 참가 인원 <span className="text-yellow-400 font-mono font-bold">{roomState.players.length}/8</span>
                        </p>
                    </div>
                </div>

                {/* 초대 코드 및 출제 호선 정보 바 */}
                <div className="bg-gray-950/70 border border-gray-800 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400">초대 코드:</span>
                        <span className="px-3 py-1 bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 font-mono font-black text-sm rounded-xl">
                            {roomState.inviteCode}
                        </span>
                        <button
                            onClick={handleCopy}
                            className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1"
                        >
                            <Copy className="w-3.5 h-3.5" />
                            <span>{copiedToast ? '복사됨! ✅' : '복사'}</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
                        <span className="text-[11px] font-bold text-gray-500 shrink-0">출제 호선:</span>
                        {roomState.selectedLineIds.length >= 20 ? (
                            <span className="px-2.5 py-0.5 bg-yellow-400 text-gray-950 font-black text-[10px] rounded-full shrink-0">
                                🌟 전국 28개 전 노선
                            </span>
                        ) : (
                            SUBWAY_LINES.filter(l => roomState.selectedLineIds.includes(l.id)).slice(0, 4).map(line => (
                                <span
                                    key={line.id}
                                    className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shrink-0"
                                    style={{ backgroundColor: line.color }}
                                >
                                    {line.name}
                                </span>
                            ))
                        )}
                    </div>
                </div>

                {/* 8인 참가자 슬롯 그리드 (2열 x 4행) */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {totalSlots.map((player: PartyPlayer | null, idx: number) => (
                        <div
                            key={player ? player.id : `empty-${idx}`}
                            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                                player
                                    ? player.id === currentUserId
                                        ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md'
                                        : 'bg-gray-950/60 border-gray-800'
                                    : 'bg-gray-950/20 border-dashed border-gray-800 opacity-60'
                            }`}
                        >
                            {player ? (
                                <div className="flex items-center gap-3 min-w-0 w-full justify-between">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center font-black text-sm text-yellow-400 shrink-0 border border-gray-700">
                                            {idx + 1}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-black truncate text-white">
                                                    {player.nickname}
                                                </span>
                                                {player.isHost && (
                                                    <span className="px-1.5 py-0.2 bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 text-[9px] font-black rounded-full flex items-center gap-0.5 shrink-0">
                                                        <Crown className="w-3 h-3 text-yellow-400" /> 방장
                                                    </span>
                                                )}
                                            </div>
                                            {player.equippedTitle && (
                                                <p className="text-[10px] text-yellow-300/90 font-bold truncate">
                                                    ✨ {player.equippedTitle}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="shrink-0">
                                        {player.isHost ? (
                                            <span className="px-2 py-1 bg-yellow-400/10 text-yellow-300 border border-yellow-400/30 text-[10px] font-black rounded-xl">
                                                HOST
                                            </span>
                                        ) : player.isReady ? (
                                            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black rounded-xl flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> READY
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 bg-gray-800 text-gray-400 text-[10px] font-bold rounded-xl flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> 대기
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-gray-600 text-xs font-bold py-1">
                                    <span className="w-7 h-7 rounded-lg border border-dashed border-gray-800 flex items-center justify-center text-[10px]">
                                        {idx + 1}
                                    </span>
                                    <span>+ 빈 슬롯 (대기 중)</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* 하단 제어 버튼 영역 */}
                <div className="space-y-3">
                    {isHost ? (
                        <div>
                            <button
                                onClick={onStartGame}
                                disabled={!canStart}
                                className="w-full py-4 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 disabled:from-gray-800 disabled:to-gray-800 text-gray-950 disabled:text-gray-500 font-black text-lg rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <Play className="w-5 h-5 fill-current" />
                                🚀 파티 게임 시작하기 (2~8인 서바이벌)
                            </button>
                            {!canStart && (
                                <p className="text-center text-xs text-amber-400 font-bold mt-2">
                                    ⚠️ 최소 2명 이상 접속하고 모든 참가자가 [준비 완료] 상태여야 시작할 수 있습니다.
                                </p>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={onToggleReady}
                            className={`w-full py-4 font-black text-base rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                me?.isReady
                                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'
                                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                            }`}
                        >
                            <ShieldCheck className="w-5 h-5" />
                            {me?.isReady ? '⏳ 준비 취소 (CANCEL)' : '🟢 준비 완료 (READY)'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
