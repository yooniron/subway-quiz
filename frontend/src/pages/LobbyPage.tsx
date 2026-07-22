import React from 'react';
import { Users, Zap, PlusCircle, RefreshCw, ArrowLeft, Radio, PlayCircle } from 'lucide-react';
import type { LobbyRoom } from '../types';
import { SUBWAY_LINES } from '../components/common/LineSelectorModal';

interface LobbyPageProps {
    lobbies: LobbyRoom[];
    isLoading: boolean;
    onRefresh: () => void;
    onQuickMatch: () => void;
    onOpenCreateRoom: () => void;
    onJoinRoom: (roomId: string) => void;
    onBackToMenu: () => void;
}

export const LobbyPage: React.FC<LobbyPageProps> = ({
    lobbies,
    isLoading,
    onRefresh,
    onQuickMatch,
    onOpenCreateRoom,
    onJoinRoom,
    onBackToMenu
}) => {
    const waitingCount = lobbies.filter((r) => r.status === 'WAITING').length;
    const playingCount = lobbies.filter((r) => r.status === 'PLAYING').length;

    return (
        <div className="flex min-h-screen flex-col items-center bg-gray-950 text-white font-sans px-4 py-8 relative overflow-x-hidden">
            {/* 네온 배경 블러 효과 */}
            <div className="absolute top-10 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-4xl z-10 animate-fade-in">
                {/* 상단 툴바 & 뒤로가기 */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={onBackToMenu}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 text-xs font-bold text-gray-300 hover:text-white transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" /> 메인 메뉴
                    </button>

                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-xs font-bold text-emerald-400">REALTIME LOBBY</span>
                    </div>
                </div>

                {/* 로비 메인 타이틀 & 통계 바 */}
                <div className="bg-gray-900/90 border border-gray-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-white flex items-center gap-2 mb-1">
                            <Users className="w-7 h-7 text-amber-400" /> 실시간 멀티 대전 로비
                        </h1>
                        <p className="text-xs text-gray-400">대기 중인 방에 입장하거나 나만의 대전 방을 개설해 보세요.</p>
                    </div>

                    {/* 카운터 뱃지 */}
                    <div className="flex items-center gap-2 bg-gray-950 px-4 py-2.5 rounded-2xl border border-gray-800 text-xs font-bold">
                        <span className="flex items-center gap-1 text-emerald-400">
                            <Radio className="w-3.5 h-3.5" /> 대기 {waitingCount}개
                        </span>
                        <span className="text-gray-700">|</span>
                        <span className="flex items-center gap-1 text-amber-400">
                            <PlayCircle className="w-3.5 h-3.5" /> 대전 중 {playingCount}개
                        </span>
                        <span className="text-gray-700">|</span>
                        <span className="text-gray-400">총 {lobbies.length}개</span>
                    </div>
                </div>

                {/* 1. 상단 최우선 배치: 방 목록 카드 그리드 */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-3 px-1">
                        <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-amber-400" /> 개설된 대전방 목록
                        </h2>
                        <span className="text-[11px] text-gray-500 font-mono">실시간 자동 반영 중</span>
                    </div>

                    {lobbies.length === 0 ? (
                        <div className="bg-gray-900/40 border border-gray-800/60 rounded-3xl p-10 text-center flex flex-col items-center justify-center">
                            <Users className="w-12 h-12 text-gray-700 mb-3 animate-pulse" />
                            <h3 className="text-base font-bold text-gray-300 mb-1">현재 개설된 대전 방이 없습니다</h3>
                            <p className="text-xs text-gray-500 mb-5">하단 '방 만들기' 버튼으로 첫 번째 대전방을 개설해 보세요!</p>
                            <button
                                onClick={onOpenCreateRoom}
                                className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-gray-950 font-black text-xs rounded-xl shadow-lg transition-all"
                            >
                                ➕ 방 만들기
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {lobbies.map((room) => {
                                const isWaiting = room.status === 'WAITING';
                                const isFull = room.player_count >= 2;
                                const lineIds = room.selected_line_ids || [];
                                const isAllLines = lineIds.length === 0 || lineIds.length === SUBWAY_LINES.length;

                                return (
                                    <div
                                        key={room.id}
                                        className={`relative bg-gray-900 border rounded-3xl p-5 transition-all flex flex-col justify-between ${
                                            isWaiting && !isFull
                                                ? 'border-gray-800 hover:border-amber-400/50 shadow-xl'
                                                : 'border-gray-900 opacity-60'
                                        }`}
                                    >
                                        {/* 상단 뱃지 헤더 */}
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <h3 className="font-bold text-sm text-white line-clamp-1 flex-1 pr-2">
                                                {room.room_title || '즐거운 스피드 대전 방'}
                                            </h3>
                                            <span
                                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                                                    isWaiting
                                                        ? 'bg-emerald-400/10 border border-emerald-400/30 text-emerald-400'
                                                        : 'bg-amber-400/10 border border-amber-400/30 text-amber-400'
                                                }`}
                                            >
                                                {isWaiting ? '🟢 대기 중' : '🔴 대전 중'}
                                            </span>
                                        </div>

                                        {/* 호선 뱃지 리스트 */}
                                        <div className="flex flex-wrap gap-1 mb-4">
                                            {isAllLines ? (
                                                <span className="px-2 py-0.5 bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-bold rounded-md">
                                                    🌟 1~9호선 전체
                                                </span>
                                            ) : (
                                                lineIds.map((id) => {
                                                    const lineInfo = SUBWAY_LINES.find((l) => l.id === id);
                                                    return (
                                                        <span
                                                            key={id}
                                                            className="px-2 py-0.5 text-[10px] font-bold text-white rounded-md shadow-xs"
                                                            style={{ backgroundColor: lineInfo?.color || '#555' }}
                                                        >
                                                            {lineInfo?.name || `${id}호선`}
                                                        </span>
                                                    );
                                                })
                                            )}
                                        </div>

                                        {/* 하단 인원 현황 & 입장 버튼 */}
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-800/80">
                                            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-gray-400">
                                                <Users className="w-3.5 h-3.5 text-gray-500" />
                                                <span>{room.player_count} / 2 명</span>
                                            </div>

                                            <button
                                                disabled={!isWaiting || isFull}
                                                onClick={() => onJoinRoom(room.id)}
                                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                                    isWaiting && !isFull
                                                        ? 'bg-amber-400 hover:bg-amber-500 text-gray-950 shadow-md shadow-amber-400/20 active:scale-95'
                                                        : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                                }`}
                                            >
                                                {isFull ? '입장 불가' : isWaiting ? '입장하기 ⚔️' : '대전 중'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 2. 하단 배치: 액션 컨트롤러 (빠른 자동 매칭 & 커스텀 방 만들기 & 새로고침) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                    <button
                        onClick={onQuickMatch}
                        className="py-4 px-5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-gray-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-400/10 transition-transform active:scale-98 flex items-center justify-center gap-2 group"
                    >
                        <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        빠른 자동 매칭 (무작위)
                    </button>

                    <button
                        onClick={onOpenCreateRoom}
                        className="py-4 px-5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-500/10 transition-transform active:scale-98 flex items-center justify-center gap-2 group"
                    >
                        <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        맞춤 방 만들기
                    </button>

                    <button
                        onClick={onRefresh}
                        disabled={isLoading}
                        className="py-4 px-5 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
                        🔄 방 목록 새로고침
                    </button>
                </div>
            </div>
        </div>
    );
};
