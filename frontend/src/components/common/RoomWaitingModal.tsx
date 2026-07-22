import React, { useState, useEffect } from 'react';
import { Users, Crown, CheckCircle2, Clock, Copy, LogOut, Zap, Sparkles, Lightbulb } from 'lucide-react';
import { SUBWAY_LINES } from './LineSelectorModal';

interface RoomWaitingModalProps {
    roomId: string;
    roomTitle?: string;
    selectedLineIds?: number[] | null;
    role: 'player_1' | 'player_2' | null;
    isP2Connected: boolean;
    isP2Ready: boolean;
    onToggleReady: () => void;
    onStartGame: () => void;
    onExitRoom: () => void;
    showToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

const SUBWAY_TIPS = [
    "💡 알고 계셨나요? 서울 지하철 2호선은 대한민국 유일의 순환 노선입니다!",
    "💡 힌트 팁: 남은 시간이 20초, 10초 이하로 떨어지면 추가 힌트가 계속 열립니다!",
    "💡 알고 계셨나요? 9호선은 급행열차와 일반열차가 같은 선로를 교대로 운행합니다!",
    "💡 팁: 빠르게 정답을 맞힐수록 최대 100점의 고득점을 획득할 수 있습니다!",
    "💡 알고 계셨나요? 환승역은 노선 색상이 조화롭게 섞인 멀티 브랜드 뱃지로 노출됩니다!"
];

export const RoomWaitingModal: React.FC<RoomWaitingModalProps> = ({
    roomId,
    roomTitle = '즐거운 지하철 스피드 대전 방',
    selectedLineIds,
    role,
    isP2Connected,
    isP2Ready,
    onToggleReady,
    onStartGame,
    onExitRoom,
    showToast
}) => {
    const [tipIndex, setTipIndex] = useState(0);
    const [floatingEmoji, setFloatingEmoji] = useState<string | null>(null);

    // 5초 간격 TMI 상식 롤링
    useEffect(() => {
        const interval = setInterval(() => {
            setTipIndex((prev) => (prev + 1) % SUBWAY_TIPS.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const isHost = role === 'player_1';
    const lineIds = selectedLineIds || [];
    const isAllLines = lineIds.length === 0 || lineIds.length === SUBWAY_LINES.length;

    const handleCopyLink = () => {
        const inviteUrl = `${window.location.origin}?room=${roomId}`;
        navigator.clipboard.writeText(inviteUrl);
        showToast('success', "🔗 초대 링크가 클립보드에 복사되었습니다!");
    };

    const triggerEmoji = (emoji: string) => {
        setFloatingEmoji(emoji);
        setTimeout(() => setFloatingEmoji(null), 1200);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/90 backdrop-blur-lg p-4 animate-fade-in">
            {/* 이모지 둥둥 떠오르는 연출 */}
            {floatingEmoji && (
                <div className="absolute z-50 text-6xl animate-bounce pointer-events-none drop-shadow-2xl">
                    {floatingEmoji}
                </div>
            )}

            <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col gap-6 animate-card-pop">
                {/* 상단 은은한 네온 배경 블러 */}
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

                {/* 헤더 & 방 제목 */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[10px] font-black uppercase tracking-wider">
                                GAME ROOM LOBBY
                            </span>
                            <span className="text-[11px] font-mono text-gray-500">ID: {roomId.slice(0, 8)}...</span>
                        </div>
                        <h2 className="text-xl font-black text-white line-clamp-1">
                            {roomTitle}
                        </h2>
                    </div>

                    <button
                        onClick={onExitRoom}
                        className="p-2 rounded-xl bg-gray-950 border border-gray-800 hover:border-red-500/40 text-gray-400 hover:text-red-400 transition-colors shrink-0"
                        title="방 나가기"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>

                {/* 출제 호선 뱃지 요약 */}
                <div className="bg-gray-950/80 border border-gray-800/80 rounded-2xl p-3 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-gray-400">출제 노선:</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                        {isAllLines ? (
                            <span className="px-2.5 py-0.5 bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-black rounded-lg">
                                🌟 1~9호선 전체 출제
                            </span>
                        ) : (
                            lineIds.map((id) => {
                                const lineInfo = SUBWAY_LINES.find((l) => l.id === id);
                                return (
                                    <span
                                        key={id}
                                        className="px-2 py-0.5 text-xs font-bold text-white rounded-md shadow-xs"
                                        style={{ backgroundColor: lineInfo?.color || '#555' }}
                                    >
                                        {lineInfo?.name || `${id}호선`}
                                    </span>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* 플레이어 대기 슬롯 카드 (2인) */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Player 1 (방장) 카드 */}
                    <div className="bg-gray-950/80 border border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.1)] rounded-2xl p-4 flex flex-col items-center justify-center text-center relative">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-gray-950 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                            <Crown className="w-3 h-3 fill-gray-950" /> 방장 {isHost && '(나)'}
                        </div>
                        <div className="w-12 h-12 rounded-full bg-amber-400/10 border-2 border-amber-400/80 flex items-center justify-center text-amber-400 mt-2 mb-2">
                            <Users className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-white mb-1">Player 1</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-[10px] font-black tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 fill-emerald-400/20" /> 대기 중
                        </span>
                    </div>

                    {/* Player 2 (참가자) 카드 */}
                    <div className={`bg-gray-950/80 border rounded-2xl p-4 flex flex-col items-center justify-center text-center relative transition-all duration-300 ${
                        !isP2Connected
                            ? 'border-gray-800/80 opacity-60'
                            : isP2Ready
                            ? 'border-emerald-500 bg-emerald-950/10 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                            : 'border-rose-500 bg-rose-950/10 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-pulse'
                    }`}>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-800 text-gray-300 font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-gray-700">
                            도전자 {!isHost && '(나)'}
                        </div>

                        {isP2Connected ? (
                            <>
                                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mt-2 mb-2 transition-colors ${
                                    isP2Ready
                                        ? 'bg-emerald-500/10 border-emerald-400 text-emerald-400'
                                        : 'bg-rose-500/10 border-rose-400 text-rose-400'
                                }`}>
                                    <Users className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-bold text-white mb-1">Player 2</span>
                                {isP2Ready ? (
                                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-gray-950 text-[10px] font-black tracking-wider flex items-center gap-1 shadow-md">
                                        <CheckCircle2 className="w-3 h-3 fill-gray-950" /> READY 완료
                                    </span>
                                ) : (
                                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-black tracking-wider flex items-center gap-1 animate-pulse">
                                        <Clock className="w-3 h-3 animate-spin" /> 준비 대기 중
                                    </span>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="w-12 h-12 rounded-full bg-gray-900 border border-dashed border-gray-700 flex items-center justify-center text-gray-600 mt-2 mb-2">
                                    <Clock className="w-6 h-6 animate-pulse" />
                                </div>
                                <span className="text-xs font-bold text-gray-400 mb-1">상대 대기 중</span>
                                <span className="text-[10px] text-gray-500 font-mono">탐색 중...</span>
                            </>
                        )}
                    </div>
                </div>

                {/* 대기 중 TMI 꿀팁 롤링 바 */}
                <div className="bg-gray-950/60 border border-gray-800/60 rounded-2xl p-3.5 flex items-center gap-2.5">
                    <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
                    <p className="text-xs text-gray-300 line-clamp-1 font-medium transition-all">
                        {SUBWAY_TIPS[tipIndex]}
                    </p>
                </div>

                {/* 이모지 리액션 & 초대 링크 도구 모음 */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-1.5">
                        {['👋', '🔥', '⚡', '🏆'].map((emoji) => (
                            <button
                                key={emoji}
                                onClick={() => triggerEmoji(emoji)}
                                className="w-9 h-9 rounded-xl bg-gray-950 border border-gray-800 hover:border-amber-400/40 text-base flex items-center justify-center active:scale-90 transition-transform"
                                title="이모지 전송"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleCopyLink}
                        className="px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 hover:border-blue-400/40 text-xs font-bold text-blue-400 flex items-center gap-1.5 transition-colors active:scale-95"
                    >
                        <Copy className="w-3.5 h-3.5" /> 초대 링크 복사
                    </button>
                </div>

                {/* 메인 준비/시작 액션 버튼 */}
                <div className="mt-1">
                    {isHost ? (
                        /* 방장 시점 (Player 1): 상대방 READY 완료 시 START 버튼 가동 */
                        <button
                            disabled={!isP2Connected || !isP2Ready}
                            onClick={onStartGame}
                            className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-xl ${
                                isP2Connected && isP2Ready
                                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-gray-950 shadow-amber-400/20 active:scale-98 animate-pulse'
                                    : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700/50'
                            }`}
                        >
                            <Sparkles className="w-4 h-4" />
                            {!isP2Connected
                                ? '상대 플레이어 입장을 대기 중입니다...'
                                : !isP2Ready
                                ? '상대 플레이어의 READY를 대기 중...'
                                : '🚀 GAME START (대전 시작!)'}
                        </button>
                    ) : (
                        /* 참가자 시점 (Player 2): READY 준비 완료 토글 버튼 */
                        <button
                            onClick={onToggleReady}
                            className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-xl active:scale-98 ${
                                isP2Ready
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                                    : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25 animate-pulse'
                            }`}
                        >
                            <Zap className="w-4 h-4" />
                            {isP2Ready ? '🟢 READY 준비 완료! (클릭 시 취소)' : '⚡ READY 준비 완료하기'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
