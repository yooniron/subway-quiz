import React, { useState } from 'react';
import { Check, Dices, Layers, X, MapPin, Sparkles } from 'lucide-react';
import { 
    SUBWAY_LINES, 
    REGION_TABS, 
    getLinesByRegion, 
    type LineOption, 
    type RegionCode 
} from '../../constants/lines';

export type { LineOption, RegionCode };
export { SUBWAY_LINES, REGION_TABS };

interface LineSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedLineIds: number[];
    onSelectLines: (lineIds: number[]) => void;
    onConfirmStart?: (selectedLineIds: number[]) => void;
    targetMode?: 'SINGLE' | 'MULTIPLAYER' | 'PRACTICE' | null;
}

export const LineSelectorModal: React.FC<LineSelectorModalProps> = ({
    isOpen,
    onClose,
    selectedLineIds,
    onSelectLines,
    onConfirmStart,
    targetMode
}) => {
    const [activeRegion, setActiveRegion] = useState<RegionCode>('ALL');

    if (!isOpen) return null;

    const displayedLines = getLinesByRegion(activeRegion);
    const isAllSelected = selectedLineIds.length === SUBWAY_LINES.length;

    // 현재 탭에 속한 호선들의 선택 여부 확인
    const currentRegionLineIds = displayedLines.map((l) => l.id);
    const isCurrentRegionAllSelected = currentRegionLineIds.every((id) => selectedLineIds.includes(id));

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

    // 현재 선택된 탭 지역 전체 토글
    const handleToggleCurrentRegion = () => {
        if (activeRegion === 'ALL') {
            handleToggleAll();
            return;
        }

        if (isCurrentRegionAllSelected) {
            // 해당 지역 호선들을 제외 (단, 최소 1개는 남아야 함)
            const remaining = selectedLineIds.filter((id) => !currentRegionLineIds.includes(id));
            onSelectLines(remaining.length > 0 ? remaining : [1]);
        } else {
            // 해당 지역 호선들을 추가
            const combined = Array.from(new Set([...selectedLineIds, ...currentRegionLineIds])).sort((a, b) => a - b);
            onSelectLines(combined);
        }
    };

    // 무작위 1개 픽스
    const handleRandomOne = () => {
        const randomLine = SUBWAY_LINES[Math.floor(Math.random() * SUBWAY_LINES.length)];
        onSelectLines([randomLine.id]);
    };

    const handleStart = () => {
        if (onConfirmStart) {
            onConfirmStart(selectedLineIds);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/85 backdrop-blur-md px-3 sm:px-4 animate-fade-in">
            <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-gray-900 border border-gray-800 rounded-3xl p-5 sm:p-6 shadow-2xl animate-card-pop overflow-hidden">
                {/* 닫기 버튼 */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors p-1 rounded-xl hover:bg-gray-800"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* 모달 타이틀 헤더 */}
                <div className="flex items-center gap-3 mb-3 shrink-0">
                    <div className="w-10 h-10 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-400 shadow-inner shrink-0">
                        <Layers className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black text-white">
                                {targetMode === 'MULTIPLAYER' ? '1대1 대전 호선 지정' : targetMode === 'PRACTICE' ? '연습 호선 지정' : '싱글 타임어택 호선 지정'}
                            </h3>
                            <span className="px-2 py-0.5 text-[10px] font-black bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 rounded-full flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" /> 전국 28개
                            </span>
                        </div>
                        <p className="text-xs text-gray-400">전국 지하철·광역철도·GTX 중 출제받을 호선을 고르세요</p>
                    </div>
                </div>

                {/* 지역별 필터 탭 (수평 스크롤 지원) */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 shrink-0 scrollbar-none">
                    {REGION_TABS.map((tab) => {
                        const isActive = activeRegion === tab.code;
                        const regionLines = getLinesByRegion(tab.code);
                        const selectedInTabCount = regionLines.filter((l) => selectedLineIds.includes(l.id)).length;

                        return (
                            <button
                                key={tab.code}
                                onClick={() => setActiveRegion(tab.code)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                                    isActive
                                        ? 'bg-yellow-400 text-gray-950 shadow-md shadow-yellow-400/20'
                                        : 'bg-gray-950/80 text-gray-400 hover:text-gray-200 border border-gray-800/80'
                                }`}
                            >
                                <span>{tab.label}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                                    isActive 
                                        ? 'bg-gray-950/20 text-gray-950' 
                                        : selectedInTabCount > 0 
                                            ? 'bg-yellow-400/20 text-yellow-300' 
                                            : 'bg-gray-800 text-gray-500'
                                }`}>
                                    {selectedInTabCount > 0 && selectedInTabCount < regionLines.length
                                        ? `${selectedInTabCount}/${regionLines.length}`
                                        : tab.badge}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* 스마트 컨트롤 툴바 */}
                <div className="flex gap-2 mb-3 shrink-0">
                    <button
                        onClick={handleToggleAll}
                        className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            isAllSelected
                                ? 'bg-yellow-400 text-gray-950 border-yellow-400 shadow-md shadow-yellow-400/20'
                                : 'bg-gray-950 border-gray-800 text-gray-300 hover:border-gray-700'
                        }`}
                    >
                        <Check className="w-3.5 h-3.5" />
                        {isAllSelected ? '전국 전체 해제' : '전국 28개 전체 선택'}
                    </button>

                    {activeRegion !== 'ALL' && (
                        <button
                            onClick={handleToggleCurrentRegion}
                            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                                isCurrentRegionAllSelected
                                    ? 'bg-amber-400/20 border-amber-400/40 text-amber-300'
                                    : 'bg-gray-950 border-gray-800 text-gray-300 hover:border-gray-700'
                            }`}
                        >
                            <MapPin className="w-3 h-3" />
                            {isCurrentRegionAllSelected ? '이 지역 해제' : '이 지역 전체'}
                        </button>
                    )}

                    <button
                        onClick={handleRandomOne}
                        className="py-2 px-3 bg-gray-950 border border-gray-800 hover:border-yellow-400/40 text-yellow-400 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 active:scale-95 shrink-0"
                    >
                        <Dices className="w-3.5 h-3.5" />
                        랜덤 1개
                    </button>
                </div>

                {/* 노선 칩 그리드 (스크롤 가능 영역) */}
                <div className="flex-1 overflow-y-auto pr-1 min-h-[220px] max-h-[360px] mb-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {displayedLines.map((line) => {
                            const isSelected = selectedLineIds.includes(line.id);
                            return (
                                <button
                                    key={line.id}
                                    onClick={() => toggleLine(line.id)}
                                    className={`relative py-3 px-2.5 rounded-2xl border text-xs font-black transition-all flex flex-col items-center justify-center gap-1 overflow-hidden group cursor-pointer ${
                                        isSelected
                                            ? 'bg-gray-950 border-2 shadow-md'
                                            : 'bg-gray-950/40 border-gray-800/60 opacity-40 hover:opacity-75'
                                    }`}
                                    style={{
                                        borderColor: isSelected ? line.color : undefined,
                                        boxShadow: isSelected ? `0 0 12px ${line.color}40` : undefined,
                                    }}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span
                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: line.color }}
                                        />
                                        <span className="text-white text-xs truncate max-w-[95px]">
                                            {line.name}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-medium">
                                        {line.regionName}
                                    </span>
                                    {isSelected && (
                                        <div
                                            className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] text-white font-bold"
                                            style={{ backgroundColor: line.color }}
                                        >
                                            ✓
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 게임 시작 버튼 */}
                <button
                    onClick={handleStart}
                    className="w-full py-3.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-950 font-black text-sm rounded-2xl shadow-xl shadow-yellow-400/20 transition-transform active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                    🎯 선택한 {selectedLineIds.length}개 호선으로 시작하기
                </button>
            </div>
        </div>
    );
};
