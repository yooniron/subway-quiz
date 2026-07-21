import React from 'react';
import { Check, Dices, Layers, X } from 'lucide-react';

export interface LineOption {
    id: number;
    name: string;
    color: string;
}

export const SUBWAY_LINES: LineOption[] = [
    { id: 1, name: '1호선', color: '#0052A4' },
    { id: 2, name: '2호선', color: '#00A84D' },
    { id: 3, name: '3호선', color: '#EF7C1C' },
    { id: 4, name: '4호선', color: '#00A5DE' },
    { id: 5, name: '5호선', color: '#996CAD' },
    { id: 6, name: '6호선', color: '#CD7C2F' },
    { id: 7, name: '7호선', color: '#747F00' },
    { id: 8, name: '8호선', color: '#EA545D' },
    { id: 9, name: '9호선', color: '#BDB092' },
];

interface LineSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedLineIds: number[];
    onSelectLines: (lineIds: number[]) => void;
    onConfirmStart?: (selectedLineIds: number[]) => void;
    targetMode?: 'SINGLE' | 'MULTIPLAYER' | null;
}

export const LineSelectorModal: React.FC<LineSelectorModalProps> = ({
    isOpen,
    onClose,
    selectedLineIds,
    onSelectLines,
    onConfirmStart,
    targetMode
}) => {
    if (!isOpen) return null;

    const isAllSelected = selectedLineIds.length === SUBWAY_LINES.length;

    const toggleLine = (id: number) => {
        if (selectedLineIds.includes(id)) {
            if (selectedLineIds.length === 1) return; // 최소 1개는 유지
            onSelectLines(selectedLineIds.filter((item) => item !== id));
        } else {
            onSelectLines([...selectedLineIds, id].sort((a, b) => a - b));
        }
    };

    // 전체선택 / 전체해제 스마트 토글
    const handleToggleAll = () => {
        if (isAllSelected) {
            onSelectLines([1]); // 전체 해제 시 1호선 단독 남김
        } else {
            onSelectLines(SUBWAY_LINES.map((line) => line.id)); // 전체 선택
        }
    };

    // 무작위 1개 픽스
    const handleRandomOne = () => {
        const randomId = Math.floor(Math.random() * SUBWAY_LINES.length) + 1;
        onSelectLines([randomId]);
    };

    const handleStart = () => {
        if (onConfirmStart) {
            onConfirmStart(selectedLineIds);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/85 backdrop-blur-md px-4 animate-fade-in">
            <div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl animate-card-pop">
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-gray-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2.5 mb-1">
                    <div className="w-10 h-10 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-400 shadow-inner">
                        <Layers className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white">
                            {targetMode === 'MULTIPLAYER' ? '1대1 대전 호선 지정' : '싱글 타임어택 호선 지정'}
                        </h3>
                        <p className="text-xs text-gray-400">퀴즈로 출제받을 호선을 고르세요 (다중 선택 가능)</p>
                    </div>
                </div>

                {/* 컨트롤 툴바 (전체선택 ↔ 전체해제 / 랜덤 1개) */}
                <div className="flex gap-2 my-5">
                    <button
                        onClick={handleToggleAll}
                        className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            isAllSelected
                                ? 'bg-yellow-400 text-gray-950 border-yellow-400 shadow-md shadow-yellow-400/20'
                                : 'bg-gray-950 border-gray-800 text-gray-300 hover:border-gray-700'
                        }`}
                    >
                        <Check className="w-3.5 h-3.5" />
                        {isAllSelected ? '전체 해제' : '전체 선택'}
                    </button>

                    <button
                        onClick={handleRandomOne}
                        className="py-2.5 px-4 bg-gray-950 border border-gray-800 hover:border-yellow-400/40 text-yellow-400 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95"
                    >
                        <Dices className="w-3.5 h-3.5" />
                        🎲 랜덤 1개
                    </button>
                </div>

                {/* 1~9호선 칩 그리드 */}
                <div className="grid grid-cols-3 gap-2.5 mb-6">
                    {SUBWAY_LINES.map((line) => {
                        const isSelected = selectedLineIds.includes(line.id);
                        return (
                            <button
                                key={line.id}
                                onClick={() => toggleLine(line.id)}
                                className={`relative py-3 px-3 rounded-2xl border text-xs font-black transition-all flex flex-col items-center justify-center gap-1 overflow-hidden ${
                                    isSelected
                                        ? 'bg-gray-950 border-2 shadow-lg'
                                        : 'bg-gray-950/40 border-gray-800/60 opacity-40 hover:opacity-70'
                                }`}
                                style={{
                                    borderColor: isSelected ? line.color : undefined,
                                    boxShadow: isSelected ? `0 0 12px ${line.color}40` : undefined,
                                }}
                            >
                                <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: line.color }}
                                />
                                <span className="text-white">{line.name}</span>
                                {isSelected && (
                                    <div
                                        className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white font-bold"
                                        style={{ backgroundColor: line.color }}
                                    >
                                        ✓
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* 게임 시작 버튼 */}
                <button
                    onClick={handleStart}
                    className="w-full py-4 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-950 font-black text-sm rounded-2xl shadow-xl shadow-yellow-400/20 transition-transform active:scale-98 flex items-center justify-center gap-2"
                >
                    🎯 선택한 호선으로 게임 시작 ({selectedLineIds.length}개 선택됨)
                </button>
            </div>
        </div>
    );
};
