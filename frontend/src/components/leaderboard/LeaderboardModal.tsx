import React, { useState, useRef } from 'react';
import { Trophy, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import type { RankingEntry } from '../../types';
import { SUBWAY_LINES } from '../common/LineSelectorModal';

interface LeaderboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    rankingsList: RankingEntry[];
    myId: string;
    onFetchByLine?: (lineId: number | null) => void;
}

const ALL_TAB_IDS: (number | null)[] = [null, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
    isOpen,
    onClose,
    rankingsList,
    myId,
    onFetchByLine
}) => {
    const [selectedTabLineId, setSelectedTabLineId] = useState<number | null>(null);
    
    // 마우스 드래그 스와이퍼 및 스크롤 제어를 위한 refs
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
    
    const isMouseDownRef = useRef(false);
    const startXRef = useRef(0);
    const scrollLeftRef = useRef(0);
    const hasDraggedRef = useRef(false);

    if (!isOpen) return null;

    const scrollToTab = (lineId: number | null) => {
        const key = lineId === null ? 'all' : String(lineId);
        const element = tabRefs.current[key];
        if (element && scrollContainerRef.current) {
            element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    };

    const handleTabChange = (lineId: number | null) => {
        if (hasDraggedRef.current) return; // 드래그 중 클릭 실행 방지
        setSelectedTabLineId(lineId);
        scrollToTab(lineId);
        if (onFetchByLine) {
            onFetchByLine(lineId);
        }
    };

    // 좌/우 화살표 토글 버튼 핸들러
    const handlePrevTab = () => {
        const currentIndex = ALL_TAB_IDS.indexOf(selectedTabLineId);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : ALL_TAB_IDS.length - 1;
        const targetId = ALL_TAB_IDS[prevIndex];
        setSelectedTabLineId(targetId);
        scrollToTab(targetId);
        if (onFetchByLine) onFetchByLine(targetId);
    };

    const handleNextTab = () => {
        const currentIndex = ALL_TAB_IDS.indexOf(selectedTabLineId);
        const nextIndex = currentIndex < ALL_TAB_IDS.length - 1 ? currentIndex + 1 : 0;
        const targetId = ALL_TAB_IDS[nextIndex];
        setSelectedTabLineId(targetId);
        scrollToTab(targetId);
        if (onFetchByLine) onFetchByLine(targetId);
    };

    // 마우스 드래그 스와이프 이벤트
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollContainerRef.current) return;
        isMouseDownRef.current = true;
        hasDraggedRef.current = false;
        startXRef.current = e.pageX - scrollContainerRef.current.offsetLeft;
        scrollLeftRef.current = scrollContainerRef.current.scrollLeft;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isMouseDownRef.current || !scrollContainerRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startXRef.current) * 1.5;
        if (Math.abs(walk) > 5) {
            hasDraggedRef.current = true;
        }
        scrollContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
    };

    const handleMouseUpOrLeave = () => {
        isMouseDownRef.current = false;
        setTimeout(() => {
            hasDraggedRef.current = false;
        }, 50);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/85 backdrop-blur-md animate-card-pop">
            <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl relative">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-yellow-400" /> 명예의 전당 (TOP 10)
                    </h3>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-white font-bold p-1 text-sm transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* 탭 네비게이션 컨트롤러 (양옆 화살표 토글 + 마우스 드래그 스와이퍼) */}
                <div className="relative flex items-center mb-4 group">
                    {/* 이전 탭 화살표 버튼 */}
                    <button
                        onClick={handlePrevTab}
                        className="w-8 h-8 rounded-xl bg-gray-950/90 border border-gray-800 hover:border-yellow-400/50 text-gray-300 hover:text-yellow-400 flex items-center justify-center transition-all z-10 mr-1 shadow-lg shrink-0 active:scale-95"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* 스크롤바 감춘 마우스 드래그 스와이퍼 탭 컨테이너 */}
                    <div 
                        ref={scrollContainerRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUpOrLeave}
                        onMouseLeave={handleMouseUpOrLeave}
                        className="flex gap-1.5 overflow-x-auto select-none py-1 scroll-smooth cursor-grab active:cursor-grabbing [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-1"
                    >
                        <button
                            ref={(el) => (tabRefs.current['all'] = el)}
                            onClick={() => handleTabChange(null)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                                selectedTabLineId === null
                                    ? 'bg-yellow-400 text-gray-950 shadow-md shadow-yellow-400/20'
                                    : 'bg-gray-950 border border-gray-800/80 text-gray-400 hover:text-white'
                            }`}
                        >
                            전체 랭킹
                        </button>

                        {SUBWAY_LINES.map((line) => {
                            const isActive = selectedTabLineId === line.id;
                            return (
                                <button
                                    key={line.id}
                                    ref={(el) => (tabRefs.current[String(line.id)] = el)}
                                    onClick={() => handleTabChange(line.id)}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 shrink-0 ${
                                        isActive
                                            ? 'bg-gray-950 text-white shadow-md'
                                            : 'bg-gray-950/60 border-gray-800/80 text-gray-400 hover:text-white'
                                    }`}
                                    style={{
                                        borderColor: isActive ? line.color : undefined,
                                    }}
                                >
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: line.color }} />
                                    {line.name}
                                </button>
                            );
                        })}
                    </div>

                    {/* 다음 탭 화살표 버튼 */}
                    <button
                        onClick={handleNextTab}
                        className="w-8 h-8 rounded-xl bg-gray-950/90 border border-gray-800 hover:border-yellow-400/50 text-gray-300 hover:text-yellow-400 flex items-center justify-center transition-all z-10 ml-1 shadow-lg shrink-0 active:scale-95"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1 mb-6">
                    {rankingsList.length === 0 ? (
                        <div className="text-center text-sm text-gray-500 py-10 flex flex-col items-center gap-2">
                            <Layers className="w-8 h-8 text-gray-700" />
                            <span>등록된 호선 랭킹 기록이 없습니다.</span>
                        </div>
                    ) : (
                        rankingsList.map((entry, index) => {
                            const isMe = entry.player_id === myId;
                            const isTop3 = index < 3;
                            return (
                                <div 
                                    key={entry.id || index}
                                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                                        isMe 
                                            ? 'bg-yellow-400/10 border-yellow-400/40 text-yellow-300' 
                                            : isTop3
                                            ? 'bg-gray-950/80 border-gray-800 text-white'
                                            : 'bg-gray-950/40 border-gray-800/60 text-gray-400'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center ${
                                            index === 0 
                                                ? 'bg-yellow-400 text-gray-950 shadow-md' 
                                                : index === 1 
                                                ? 'bg-slate-300 text-gray-950' 
                                                : index === 2 
                                                ? 'bg-amber-700 text-white' 
                                                : 'bg-gray-800 text-gray-400'
                                        }`}>
                                            {index + 1}
                                        </span>
                                        <div className="flex flex-col text-left">
                                            <span className="font-bold text-sm flex items-center gap-1">
                                                {entry.nickname}
                                                {isMe && <span className="text-[10px] bg-yellow-400 text-gray-950 px-1.5 py-0.2 rounded font-black">나</span>}
                                            </span>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                {entry.line_summary && (
                                                    <span className="text-[10px] bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded-md font-medium">
                                                        {entry.line_summary}
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-gray-500">
                                                    {new Date(entry.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="font-black font-mono text-base text-yellow-400">
                                        {entry.score} <span className="text-xs font-normal text-gray-500">pts</span>
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>

                <button
                    onClick={onClose}
                    className="w-full py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl text-sm transition-all"
                >
                    닫기
                </button>
            </div>
        </div>
    );
};
