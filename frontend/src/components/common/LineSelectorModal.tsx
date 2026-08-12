import React, { useState } from 'react';
import { Check, Dices, Layers, X, MapPin, Sparkles, AlertCircle, Trash2 } from 'lucide-react';
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

    // 현재 탭에 속한 호선들의 ID
    const currentRegionLineIds = displayedLines.map((l) => l.id);
    const isCurrentRegionAllSelected = currentRegionLineIds.length > 0 && currentRegionLineIds.every((id) => selectedLineIds.includes(id));

    // 개별 호선 토글 (1호선 강제 고착 없이 자유롭게 토글)
    const toggleLine = (id: number) => {
        if (selectedLineIds.includes(id)) {
            onSelectLines(selectedLineIds.filter((item) => item !== id));
        } else {
            onSelectLines([...selectedLineIds, id].sort((a, b) => a - b));
        }
    };

    // 🎯 "이 지역만 선택" (다른 모든 지역을 해제하고 현재 지역의 노선들만 단독 선택!)
    const handleSelectOnlyCurrentRegion = () => {
        if (activeRegion === 'ALL') {
            onSelectLines(SUBWAY_LINES.map((line) => line.id));
        } else {
            onSelectLines([...currentRegionLineIds].sort((a, b) => a - b));
        }
    };

    // 현재 탭의 지역만 추가 또는 해제 토글
    const handleToggleCurrentRegion = () => {
        if (activeRegion === 'ALL') {
            if (isAllSelected) {
                onSelectLines([]);
            } else {
                onSelectLines(SUBWAY_LINES.map((line) => line.id));
            }
            return;
        }

        if (isCurrentRegionAllSelected) {
            // 현재 지역 노선들만 끄기
            onSelectLines(selectedLineIds.filter((id) => !currentRegionLineIds.includes(id)));
        } else {
            // 현재 지역 노선들을 추가
            const combined = Array.from(new Set([...selectedLineIds, ...currentRegionLineIds])).sort((a, b) => a - b);
            onSelectLines(combined);
        }
    };

    // 전국 28개 전체 선택
    const handleSelectAll = () => {
        onSelectLines(SUBWAY_LINES.map((line) => line.id));
    };

    // 전체 해제 (0개로 깔끔하게 초기화)
    const handleClearAll = () => {
        onSelectLines([]);
    };

    // 무작위 1개 픽스
    const handleRandomOne = () => {
        const randomLine = SUBWAY_LINES[Math.floor(Math.random() * SUBWAY_LINES.length)];
        onSelectLines([randomLine.id]);
    };

    // 선택된 칩 개별 삭제
    const handleRemoveSingle = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        onSelectLines(selectedLineIds.filter((item) => item !== id));
    };

    const handleStart = () => {
        if (selectedLineIds.length === 0) return;
        if (onConfirmStart) {
            onConfirmStart(selectedLineIds);
        }
        onClose();
    };

    const selectedLinesData = SUBWAY_LINES.filter((l) => selectedLineIds.includes(l.id));
    const activeTabObj = REGION_TABS.find((t) => t.code === activeRegion);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/85 backdrop-blur-md px-3 sm:px-4 animate-fade-in">
            <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-gray-900 border border-gray-800 rounded-3xl p-5 sm:p-6 shadow-2xl animate-card-pop overflow-hidden">
                {/* 닫기 버튼 */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors p-1 rounded-xl hover:bg-gray-800 cursor-pointer"
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
                        <p className="text-xs text-gray-400">원하는 지역 및 호선을 자유롭게 선택하세요</p>
                    </div>
                </div>

                {/* 지역별 필터 탭 (수평 스크롤 지원) */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 shrink-0 scrollbar-none">
                    {REGION_TABS.map((tab) => {
                        const isActive = activeRegion === tab.code;
                        const regionLines = getLinesByRegion(tab.code);
                        const selectedInTabCount = regionLines.filter((l) => selectedLineIds.includes(l.id)).length;

                        return (
                            <button
                                key={tab.code}
                                onClick={() => setActiveRegion(tab.code)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                    isActive
                                        ? 'bg-yellow-400 text-gray-950 shadow-md shadow-yellow-400/20 font-black'
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

                {/* 스마트 컨트롤 툴바 (지역 단독 선택 + 전체/해제/랜덤) */}
                <div className="flex flex-col gap-1.5 mb-3 shrink-0">
                    {activeRegion !== 'ALL' && (
                        <div className="flex gap-1.5">
                            {/* 🎯 이 지역만 단독 선택 버튼 (수도권 등 다른 지역 전부 자동 해제!) */}
                            <button
                                onClick={handleSelectOnlyCurrentRegion}
                                className="flex-1 py-2 px-3 bg-gradient-to-r from-yellow-400/20 to-amber-400/20 border border-yellow-400/50 hover:border-yellow-400 text-yellow-300 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                            >
                                <MapPin className="w-3.5 h-3.5 text-yellow-400" />
                                <span>🎯 [{activeTabObj?.label}]만 단독 선택</span>
                            </button>

                            {/* 해당 지역 추가/해제 토글 */}
                            <button
                                onClick={handleToggleCurrentRegion}
                                className="py-2 px-3 bg-gray-950 border border-gray-800 hover:border-gray-700 text-gray-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
                            >
                                {isCurrentRegionAllSelected ? '➖ 이 지역 해제' : '➕ 이 지역 추가'}
                            </button>
                        </div>
                    )}

                    <div className="flex gap-1.5">
                        <button
                            onClick={handleSelectAll}
                            className={`flex-1 py-1.5 px-2.5 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                isAllSelected
                                    ? 'bg-yellow-400 text-gray-950 border-yellow-400 shadow-sm font-black'
                                    : 'bg-gray-950 border-gray-800 text-gray-300 hover:border-gray-700'
                            }`}
                        >
                            <Check className="w-3 h-3" />
                            전국 28개 전체
                        </button>

                        <button
                            onClick={handleClearAll}
                            className={`py-1.5 px-3 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                selectedLineIds.length === 0
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-rose-300 hover:border-rose-500/30'
                            }`}
                        >
                            <Trash2 className="w-3 h-3" />
                            모두 해제
                        </button>

                        <button
                            onClick={handleRandomOne}
                            className="py-1.5 px-3 bg-gray-950 border border-gray-800 hover:border-yellow-400/40 text-yellow-400 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 active:scale-95 shrink-0 cursor-pointer"
                        >
                            <Dices className="w-3 h-3" />
                            랜덤 1개
                        </button>
                    </div>
                </div>

                {/* 현재 선택된 호선 실시간 요약 칩 바 */}
                <div className="bg-gray-950/70 border border-gray-800/80 rounded-2xl p-2.5 mb-3 shrink-0">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
                            <span>선택된 호선 현황</span>
                            <span className="text-yellow-400 font-black">({selectedLineIds.length}개)</span>
                        </span>
                        {selectedLineIds.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                className="text-[10px] text-gray-500 hover:text-rose-400 underline cursor-pointer"
                            >
                                전체 지우기
                            </button>
                        )}
                    </div>

                    {selectedLineIds.length === 0 ? (
                        <div className="py-1.5 px-2 flex items-center gap-1.5 text-rose-400 text-xs font-bold bg-rose-500/10 border border-rose-500/20 rounded-xl">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>선택된 호선이 없습니다. 아래에서 원하는 호선을 터치해주세요.</span>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-1 max-h-[72px] overflow-y-auto pr-1">
                            {selectedLinesData.map((line) => (
                                <span
                                    key={line.id}
                                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-white flex items-center gap-1 shadow-xs"
                                    style={{ backgroundColor: line.color }}
                                >
                                    <span>{line.name}</span>
                                    <button
                                        onClick={(e) => handleRemoveSingle(line.id, e)}
                                        className="hover:opacity-75 bg-black/20 rounded-full w-3.5 h-3.5 flex items-center justify-center text-[9px] cursor-pointer"
                                        title="제거"
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* 노선 칩 그리드 (스크롤 가능 영역) */}
                <div className="flex-1 overflow-y-auto pr-1 min-h-[180px] max-h-[280px] mb-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {displayedLines.map((line) => {
                            const isSelected = selectedLineIds.includes(line.id);
                            return (
                                <button
                                    key={line.id}
                                    onClick={() => toggleLine(line.id)}
                                    className={`relative py-2.5 px-2.5 rounded-2xl border text-xs font-black transition-all flex flex-col items-center justify-center gap-0.5 overflow-hidden group cursor-pointer active:scale-95 ${
                                        isSelected
                                            ? 'bg-gray-950 border-2 shadow-md'
                                            : 'bg-gray-950/40 border-gray-800/60 opacity-35 hover:opacity-75'
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
                    disabled={selectedLineIds.length === 0}
                    className={`w-full py-3.5 font-black text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 shrink-0 ${
                        selectedLineIds.length > 0
                            ? 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-950 shadow-yellow-400/20 active:scale-95 cursor-pointer'
                            : 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed opacity-60'
                    }`}
                >
                    {selectedLineIds.length > 0 ? (
                        <span>🎯 선택한 {selectedLineIds.length}개 호선으로 시작하기</span>
                    ) : (
                        <span>⚠️ 최소 1개 이상의 호선을 선택해주세요</span>
                    )}
                </button>
            </div>
        </div>
    );
};
