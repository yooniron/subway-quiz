import React from 'react';
import type { Quiz } from '../../types';

interface InteractiveSubwayMapProps {
    quiz: Quiz;
    onSelectStation?: (stationName: string) => void;
    showL1?: boolean;
    showL2?: boolean;
    selectedStationName?: string;
}

export const InteractiveSubwayMap: React.FC<InteractiveSubwayMapProps> = ({
    quiz,
    onSelectStation,
    showL1 = true,
    showL2 = true,
    selectedStationName = ''
}) => {
    const cleanTarget = (quiz.target_station_name || '').replace(/역$/, '');
    const cleanL2 = (quiz.left_2 || '').replace(/역$/, '');
    const cleanL1 = (quiz.left_1 || '').replace(/역$/, '');
    const cleanR1 = (quiz.right_1 || '').replace(/역$/, '');
    const cleanR2 = (quiz.right_2 || '').replace(/역$/, '');

    // 터치/클릭 가능한 후보 정답 생성 (순서 셔플)
    const candidates = React.useMemo(() => {
        const set = new Set<string>();
        if (cleanTarget) set.add(cleanTarget);
        if (cleanL1) set.add(cleanL1);
        if (cleanL2) set.add(cleanL2);
        if (cleanR1) set.add(cleanR1);
        if (cleanR2) set.add(cleanR2);

        // 기본 후보군 보강
        const extraFallback = ['강남', '신도림', '홍대입구', '서울역', '잠실'];
        extraFallback.forEach(name => {
            if (set.size < 4) set.add(name);
        });

        return Array.from(set).sort(() => Math.sin(cleanTarget.length + set.size));
    }, [cleanTarget, cleanL1, cleanL2, cleanR1, cleanR2]);

    const handleNodeClick = (name: string) => {
        if (!name || name === '?' || !onSelectStation) return;
        onSelectStation(name);
    };

    return (
        <div className="w-full bg-gray-900/90 border border-gray-800 rounded-3xl p-4 sm:p-6 shadow-2xl mb-4 text-center backdrop-blur-md animate-fade-in">
            <div className="flex items-center justify-between mb-4 px-2">
                <span className="text-xs font-black text-gray-400 tracking-wider flex items-center gap-1.5">
                    🗺️ 노선도 인터랙티브 지도 (Touch Station Map)
                </span>
                <span 
                    className="text-[10px] font-black px-2.5 py-0.5 rounded-full text-white tracking-widest shadow-sm"
                    style={{ backgroundColor: quiz.color_code || '#00A84D' }}
                >
                    {quiz.line_name || '노선'}
                </span>
            </div>

            {/* SVG 레일 및 5개 노선 node 다이어그램 */}
            <div className="relative flex items-center justify-between w-full px-2 py-6 sm:py-8 my-2">
                <div 
                    className="absolute left-4 right-4 h-2.5 sm:h-3.5 -z-10 rounded-full shadow-inner opacity-80" 
                    style={{ backgroundColor: quiz.color_code || '#00A84D', top: '44%' }} 
                />

                {/* Left 2 Node */}
                <div className={`flex flex-col items-center w-1/5 transition-all ${showL2 ? 'opacity-100' : 'opacity-25 blur-[1px]'}`}>
                    <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 sm:border-4 border-white bg-gray-950 flex items-center justify-center shadow-lg">
                        <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full" style={{ backgroundColor: quiz.color_code }} />
                    </div>
                    <span className="mt-2 text-[10px] sm:text-xs font-bold text-gray-300 truncate max-w-[50px] sm:max-w-[75px]">
                        {showL2 ? cleanL2 || '?' : '?'}
                    </span>
                </div>

                {/* Left 1 Node */}
                <div className={`flex flex-col items-center w-1/5 transition-all ${showL1 ? 'opacity-100' : 'opacity-25 blur-[1px]'}`}>
                    <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 sm:border-4 border-white bg-gray-950 flex items-center justify-center shadow-lg">
                        <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full" style={{ backgroundColor: quiz.color_code }} />
                    </div>
                    <span className="mt-2 text-[10px] sm:text-xs font-bold text-gray-300 truncate max-w-[50px] sm:max-w-[75px]">
                        {showL1 ? cleanL1 || '?' : '?'}
                    </span>
                </div>

                {/* TARGET MYSTERY NODE (Clickable Pin) */}
                <div className="flex flex-col items-center w-1/5">
                    <div 
                        className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-4 border-yellow-400 bg-yellow-400 text-gray-950 flex items-center justify-center shadow-2xl animate-bounce cursor-pointer active:scale-95"
                    >
                        <span className="font-black text-sm sm:text-xl">?</span>
                    </div>
                    <span className="mt-2 text-[10px] sm:text-xs font-black text-yellow-400 tracking-wider">
                        [ 정답 타겟 ]
                    </span>
                </div>

                {/* Right 1 Node */}
                <div className={`flex flex-col items-center w-1/5 transition-all ${showL1 ? 'opacity-100' : 'opacity-25 blur-[1px]'}`}>
                    <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 sm:border-4 border-white bg-gray-950 flex items-center justify-center shadow-lg">
                        <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full" style={{ backgroundColor: quiz.color_code }} />
                    </div>
                    <span className="mt-2 text-[10px] sm:text-xs font-bold text-gray-300 truncate max-w-[50px] sm:max-w-[75px]">
                        {showL1 ? cleanR1 || '?' : '?'}
                    </span>
                </div>

                {/* Right 2 Node */}
                <div className={`flex flex-col items-center w-1/5 transition-all ${showL2 ? 'opacity-100' : 'opacity-25 blur-[1px]'}`}>
                    <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 sm:border-4 border-white bg-gray-950 flex items-center justify-center shadow-lg">
                        <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full" style={{ backgroundColor: quiz.color_code }} />
                    </div>
                    <span className="mt-2 text-[10px] sm:text-xs font-bold text-gray-300 truncate max-w-[50px] sm:max-w-[75px]">
                        {showL2 ? cleanR2 || '?' : '?'}
                    </span>
                </div>
            </div>

            {/* 터치 전용 1-Click 선택역 후보 칩 버블 */}
            <div className="mt-4 pt-3 border-t border-gray-800/80">
                <p className="text-[11px] text-gray-400 font-bold mb-2">👇 지도 터치로 빠르게 정답 선택하기</p>
                <div className="flex flex-wrap gap-2 justify-center">
                    {candidates.map(candidate => (
                        <button
                            key={candidate}
                            type="button"
                            onClick={() => handleNodeClick(candidate)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95 border ${
                                selectedStationName === candidate
                                    ? 'bg-yellow-400 border-yellow-300 text-gray-950 shadow-md scale-105'
                                    : 'bg-gray-950 hover:bg-gray-800 border-gray-800 text-gray-200 hover:border-gray-700'
                            }`}
                        >
                            📍 {candidate}역
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
