import React, { useState } from 'react';
import { PlusCircle, X, Check, Dices, Lock, Globe, KeyRound } from 'lucide-react';
import { SUBWAY_LINES } from './LineSelectorModal';

interface CreateRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateRoom: (roomTitle: string, selectedLineIds: number[], isPrivate: boolean, password?: string) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
    isOpen,
    onClose,
    onCreateRoom
}) => {
    const [roomTitle, setRoomTitle] = useState('즐거운 지하철 퀴즈 대전');
    const [selectedLineIds, setSelectedLineIds] = useState<number[]>(() => SUBWAY_LINES.map(l => l.id));
    const [isPrivate, setIsPrivate] = useState(false);
    const [password, setPassword] = useState('');

    if (!isOpen) return null;

    const isAllSelected = selectedLineIds.length === SUBWAY_LINES.length;

    const toggleLine = (id: number) => {
        if (selectedLineIds.includes(id)) {
            if (selectedLineIds.length === 1) return;
            setSelectedLineIds(selectedLineIds.filter((item) => item !== id));
        } else {
            setSelectedLineIds([...selectedLineIds, id].sort((a, b) => a - b));
        }
    };

    const handleToggleAll = () => {
        if (isAllSelected) {
            setSelectedLineIds([1]);
        } else {
            setSelectedLineIds(SUBWAY_LINES.map((line) => line.id));
        }
    };

    const handleRandomOne = () => {
        const randomId = Math.floor(Math.random() * SUBWAY_LINES.length) + 1;
        setSelectedLineIds([randomId]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanTitle = roomTitle.trim() || '즐거운 지하철 퀴즈 대전';
        onCreateRoom(cleanTitle, selectedLineIds, isPrivate, isPrivate ? password.trim() : '');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/85 backdrop-blur-md px-4 animate-fade-in">
            <div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl animate-card-pop max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-gray-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shadow-inner">
                        <PlusCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white">맞춤 대전방 만들기</h3>
                        <p className="text-xs text-gray-400">방 제목, 공개 설정 및 출제 호선을 설정하세요</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* 방 제목 입력 인풋 */}
                    <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1.5">방 제목</label>
                        <input
                            type="text"
                            maxLength={35}
                            value={roomTitle}
                            onChange={(e) => setRoomTitle(e.target.value)}
                            placeholder="예: 2호선 고수 모십니다!"
                            className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-400 transition-colors"
                        />
                    </div>

                    {/* 공개 / 비공개 설정 스위치 */}
                    <div className="bg-gray-950/80 border border-gray-800/80 rounded-2xl p-3.5 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                                {isPrivate ? <Lock className="w-4 h-4 text-rose-400" /> : <Globe className="w-4 h-4 text-emerald-400" />}
                                방 공개 여부
                            </span>
                            <div className="flex p-1 bg-gray-900 rounded-xl border border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setIsPrivate(false)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                        !isPrivate
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-xs'
                                            : 'text-gray-500 hover:text-gray-300'
                                    }`}
                                >
                                    🌐 공개
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsPrivate(true)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                        isPrivate
                                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-xs'
                                            : 'text-gray-500 hover:text-gray-300'
                                    }`}
                                >
                                    🔒 비공개
                                </button>
                            </div>
                        </div>

                        {isPrivate && (
                            <div className="pt-2 border-t border-gray-800/80 animate-fade-in">
                                <label className="block text-[11px] font-bold text-rose-300 mb-1 flex items-center gap-1">
                                    <KeyRound className="w-3 h-3 text-rose-400" /> 입장 비밀번호 입력
                                </label>
                                <input
                                    type="password"
                                    maxLength={20}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="비밀번호 설정 (숫자/문자)..."
                                    className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-rose-400 transition-colors"
                                />
                            </div>
                        )}
                    </div>

                    {/* 출제 호선 다중 선택 */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-gray-300">출제 호선 지정</label>
                            <span className="text-[11px] text-amber-400 font-bold">{selectedLineIds.length}개 선택됨</span>
                        </div>

                        <div className="flex gap-2 mb-3">
                            <button
                                type="button"
                                onClick={handleToggleAll}
                                className={`flex-1 py-2 px-2.5 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                                    isAllSelected
                                        ? 'bg-amber-400 text-gray-950 border-amber-400 shadow-md'
                                        : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white'
                                }`}
                            >
                                <Check className="w-3 h-3" />
                                {isAllSelected ? '전체 해제' : '전체 선택 (1~9호선)'}
                            </button>

                            <button
                                type="button"
                                onClick={handleRandomOne}
                                className="py-2 px-3 bg-gray-950 border border-gray-800 hover:border-amber-400/40 text-amber-400 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1"
                            >
                                <Dices className="w-3 h-3" />
                                랜덤 1개
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {SUBWAY_LINES.map((line) => {
                                const isSelected = selectedLineIds.includes(line.id);
                                return (
                                    <button
                                        key={line.id}
                                        type="button"
                                        onClick={() => toggleLine(line.id)}
                                        className={`relative py-2.5 px-2 rounded-xl border text-xs font-black transition-all flex flex-col items-center justify-center gap-0.5 overflow-hidden ${
                                            isSelected
                                                ? 'bg-gray-950 border-2 shadow-md'
                                                : 'bg-gray-950/40 border-gray-800/60 opacity-40 hover:opacity-70'
                                        }`}
                                        style={{
                                            borderColor: isSelected ? line.color : undefined,
                                            boxShadow: isSelected ? `0 0 10px ${line.color}35` : undefined,
                                        }}
                                    >
                                        <span
                                            className="w-2.5 h-2.5 rounded-full"
                                            style={{ backgroundColor: line.color }}
                                        />
                                        <span className="text-white text-[11px]">{line.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full mt-2 py-4 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-gray-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-400/20 transition-transform active:scale-98"
                    >
                        🏠 방 만들기 ➕
                    </button>
                </form>
            </div>
        </div>
    );
};
