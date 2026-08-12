import React, { useState } from 'react';
import { PlusCircle, X, Check, Dices, Lock, Globe, KeyRound, MapPin, Trash2, AlertCircle } from 'lucide-react';
import { 
    SUBWAY_LINES, 
    REGION_TABS, 
    getLinesByRegion, 
    type RegionCode 
} from '../../constants/lines';

interface CreateRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateRoom: (roomTitle: string, selectedLineIds: number[], isPrivate: boolean, password?: string, targetScore?: number) => void;
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
    const [targetScorePreset, setTargetScorePreset] = useState<'300' | '500' | '1000' | 'CUSTOM'>('500');
    const [customScoreInput, setCustomScoreInput] = useState('700');
    const [activeRegion, setActiveRegion] = useState<RegionCode>('ALL');

    if (!isOpen) return null;

    const displayedLines = getLinesByRegion(activeRegion);
    const isAllSelected = selectedLineIds.length === SUBWAY_LINES.length;
    const currentRegionLineIds = displayedLines.map((l) => l.id);
    const isCurrentRegionAllSelected = currentRegionLineIds.length > 0 && currentRegionLineIds.every((id) => selectedLineIds.includes(id));

    const toggleLine = (id: number) => {
        if (selectedLineIds.includes(id)) {
            setSelectedLineIds(selectedLineIds.filter((item) => item !== id));
        } else {
            setSelectedLineIds([...selectedLineIds, id].sort((a, b) => a - b));
        }
    };

    // 🎯 이 지역만 단독 선택 (다른 모든 지역 자동 해제)
    const handleSelectOnlyCurrentRegion = () => {
        if (activeRegion === 'ALL') {
            setSelectedLineIds(SUBWAY_LINES.map((line) => line.id));
        } else {
            setSelectedLineIds([...currentRegionLineIds].sort((a, b) => a - b));
        }
    };

    const handleToggleCurrentRegion = () => {
        if (activeRegion === 'ALL') {
            if (isAllSelected) {
                setSelectedLineIds([]);
            } else {
                setSelectedLineIds(SUBWAY_LINES.map((line) => line.id));
            }
            return;
        }

        if (isCurrentRegionAllSelected) {
            setSelectedLineIds(selectedLineIds.filter((id) => !currentRegionLineIds.includes(id)));
        } else {
            const combined = Array.from(new Set([...selectedLineIds, ...currentRegionLineIds])).sort((a, b) => a - b);
            setSelectedLineIds(combined);
        }
    };

    const handleSelectAll = () => {
        setSelectedLineIds(SUBWAY_LINES.map((line) => line.id));
    };

    const handleClearAll = () => {
        setSelectedLineIds([]);
    };

    const handleRandomOne = () => {
        const randomLine = SUBWAY_LINES[Math.floor(Math.random() * SUBWAY_LINES.length)];
        setSelectedLineIds([randomLine.id]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedLineIds.length === 0) return;

        const cleanTitle = roomTitle.trim() || '즐거운 지하철 퀴즈 대전';

        let finalTargetScore = 500;
        if (targetScorePreset === '300') finalTargetScore = 300;
        else if (targetScorePreset === '500') finalTargetScore = 500;
        else if (targetScorePreset === '1000') finalTargetScore = 1000;
        else if (targetScorePreset === 'CUSTOM') {
            const parsed = parseInt(customScoreInput.trim(), 10);
            if (!isNaN(parsed) && parsed >= 100 && parsed <= 5000) {
                finalTargetScore = parsed;
            } else {
                finalTargetScore = 500;
            }
        }

        onCreateRoom(cleanTitle, selectedLineIds, isPrivate, isPrivate ? password.trim() : '', finalTargetScore);
        onClose();
    };

    const activeTabObj = REGION_TABS.find((t) => t.code === activeRegion);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/85 backdrop-blur-md px-3 sm:px-4 animate-fade-in">
            <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-gray-900 border border-gray-800 rounded-3xl p-5 sm:p-6 shadow-2xl animate-card-pop overflow-hidden">
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-gray-500 hover:text-white transition-colors cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2.5 mb-3 shrink-0">
                    <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
                        <PlusCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white">맞춤 대전방 만들기</h3>
                        <p className="text-xs text-gray-400">방 제목, 공개 설정 및 전국 28개 출제 호선을 설정하세요</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3.5">
                    {/* 방 제목 입력 인풋 */}
                    <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1">방 제목</label>
                        <input
                            type="text"
                            maxLength={35}
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            value={roomTitle}
                            onChange={(e) => setRoomTitle(e.target.value)}
                            placeholder="예: 부산 2호선 vs 2호선 고수 대결!"
                            className="w-full px-4 py-2 min-h-[40px] bg-gray-950 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-400 transition-colors"
                        />
                    </div>

                    {/* 승리 목표 점수 맞춤 설정 */}
                    <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1 flex items-center justify-between">
                            <span>🎯 승리 목표 점수</span>
                            <span className="text-[11px] text-amber-400 font-mono font-bold">
                                {targetScorePreset === 'CUSTOM' ? `${customScoreInput || 500}pts` : `${targetScorePreset}pts`}
                            </span>
                        </label>
                        <div className="grid grid-cols-4 gap-1 p-1 bg-gray-950 rounded-xl border border-gray-800 mb-1">
                            {(['300', '500', '1000', 'CUSTOM'] as const).map((preset) => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setTargetScorePreset(preset)}
                                    className={`py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                                        targetScorePreset === preset
                                            ? 'bg-amber-400 text-gray-950 shadow-md font-black'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {preset === '300' && '⚡ 300점'}
                                    {preset === '500' && '🎯 500점'}
                                    {preset === '1000' && '👑 1000점'}
                                    {preset === 'CUSTOM' && '⚙️ 커스텀'}
                                </button>
                            ))}
                        </div>

                        {targetScorePreset === 'CUSTOM' && (
                            <div className="animate-fade-in pt-1">
                                <input
                                    type="number"
                                    min={100}
                                    max={5000}
                                    step={100}
                                    value={customScoreInput}
                                    onChange={(e) => setCustomScoreInput(e.target.value)}
                                    placeholder="목표 점수 직접 입력 (100~5000점)..."
                                    className="w-full px-3.5 py-1.5 bg-gray-950 border border-amber-400/50 rounded-xl text-xs text-amber-400 font-mono font-bold placeholder-gray-600 focus:outline-none focus:border-amber-400"
                                />
                            </div>
                        )}
                    </div>

                    {/* 공개 / 비공개 설정 스위치 */}
                    <div className="bg-gray-950/80 border border-gray-800/80 rounded-2xl p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                                {isPrivate ? <Lock className="w-3.5 h-3.5 text-rose-400" /> : <Globe className="w-3.5 h-3.5 text-emerald-400" />}
                                방 공개 여부
                            </span>
                            <div className="flex p-1 bg-gray-900 rounded-xl border border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setIsPrivate(false)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                                    className="w-full px-3.5 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-rose-400 transition-colors"
                                />
                            </div>
                        )}
                    </div>

                    {/* 출제 호선 다중 선택 */}
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="text-xs font-bold text-gray-300">출제 호선 지정</label>
                            <span className="text-[11px] text-amber-400 font-bold">{selectedLineIds.length}개 선택됨</span>
                        </div>

                        {/* 지역별 탭 */}
                        <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-2 scrollbar-none">
                            {REGION_TABS.map((tab) => (
                                <button
                                    key={tab.code}
                                    type="button"
                                    onClick={() => setActiveRegion(tab.code)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                                        activeRegion === tab.code
                                            ? 'bg-amber-400 text-gray-950 shadow-sm font-black'
                                            : 'bg-gray-950 text-gray-400 hover:text-gray-200 border border-gray-800'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* 스마트 툴바 */}
                        <div className="flex flex-col gap-1.5 mb-2">
                            {activeRegion !== 'ALL' && (
                                <div className="flex gap-1.5">
                                    <button
                                        type="button"
                                        onClick={handleSelectOnlyCurrentRegion}
                                        className="flex-1 py-1.5 px-2.5 bg-amber-400/20 border border-amber-400/50 hover:border-amber-400 text-amber-300 text-[11px] font-black rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                        <MapPin className="w-3 h-3 text-amber-400" />
                                        <span>🎯 [{activeTabObj?.label}]만 단독 선택</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleToggleCurrentRegion}
                                        className="py-1.5 px-2.5 bg-gray-950 border border-gray-800 hover:border-gray-700 text-gray-300 text-[11px] font-bold rounded-xl transition-all cursor-pointer"
                                    >
                                        {isCurrentRegionAllSelected ? '➖ 이 지역 해제' : '➕ 이 지역 추가'}
                                    </button>
                                </div>
                            )}

                            <div className="flex gap-1.5">
                                <button
                                    type="button"
                                    onClick={handleSelectAll}
                                    className={`flex-1 py-1.5 px-2 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                        isAllSelected
                                            ? 'bg-amber-400 text-gray-950 border-amber-400 shadow-md font-black'
                                            : 'bg-gray-950 border-gray-800 text-gray-300 hover:border-gray-700'
                                    }`}
                                >
                                    <Check className="w-3 h-3" />
                                    전국 28개 전체
                                </button>

                                <button
                                    type="button"
                                    onClick={handleClearAll}
                                    className={`py-1.5 px-2.5 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                        selectedLineIds.length === 0
                                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                            : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-rose-300'
                                    }`}
                                >
                                    <Trash2 className="w-3 h-3" />
                                    모두 해제
                                </button>

                                <button
                                    type="button"
                                    onClick={handleRandomOne}
                                    className="py-1.5 px-2.5 bg-gray-950 border border-gray-800 hover:border-amber-400/40 text-amber-400 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                                >
                                    <Dices className="w-3 h-3" />
                                    랜덤 1개
                                </button>
                            </div>
                        </div>

                        {selectedLineIds.length === 0 && (
                            <div className="py-1.5 px-2 mb-2 flex items-center gap-1 text-rose-400 text-[11px] font-bold bg-rose-500/10 border border-rose-500/20 rounded-xl">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>선택된 호선이 없습니다. 호선을 선택해주세요.</span>
                            </div>
                        )}

                        {/* 노선 그리드 */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[140px] overflow-y-auto p-1 bg-gray-950/60 rounded-2xl border border-gray-800/80">
                            {displayedLines.map((line) => {
                                const isSelected = selectedLineIds.includes(line.id);
                                return (
                                    <button
                                        key={line.id}
                                        type="button"
                                        onClick={() => toggleLine(line.id)}
                                        className={`relative py-2 px-2 rounded-xl border text-xs font-black transition-all flex items-center justify-between overflow-hidden cursor-pointer active:scale-95 ${
                                            isSelected
                                                ? 'bg-gray-950 border-2 shadow-sm'
                                                : 'bg-gray-950/40 border-gray-800/60 opacity-35 hover:opacity-75'
                                        }`}
                                        style={{
                                            borderColor: isSelected ? line.color : undefined,
                                        }}
                                    >
                                        <div className="flex items-center gap-1.5 truncate">
                                            <span
                                                className="w-2 h-2 rounded-full shrink-0"
                                                style={{ backgroundColor: line.color }}
                                            />
                                            <span className="text-white text-[11px] truncate">{line.name}</span>
                                        </div>
                                        {isSelected && (
                                            <span className="text-[10px] text-amber-400 font-bold shrink-0">✓</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={selectedLineIds.length === 0}
                        className={`w-full mt-1 py-3.5 font-black text-sm rounded-2xl shadow-xl transition-transform shrink-0 ${
                            selectedLineIds.length > 0
                                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-gray-950 shadow-amber-400/20 active:scale-95 cursor-pointer'
                                : 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed opacity-60'
                        }`}
                    >
                        {selectedLineIds.length > 0 ? (
                            <span>🏠 방 만들기 ➕ ({selectedLineIds.length}개 호선)</span>
                        ) : (
                            <span>⚠️ 최소 1개 이상의 호선을 선택해주세요</span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
