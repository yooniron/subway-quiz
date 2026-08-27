import React, { useMemo } from 'react';
import { X, Trophy, Zap, Flame, Target, Award, Swords, HelpCircle, Train } from 'lucide-react';
import { getUserStatsSummary } from '../../utils/userStats';

interface UserStatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    nickname?: string;
    equippedTitle?: string | null;
}

export const UserStatsModal: React.FC<UserStatsModalProps> = ({
    isOpen,
    onClose,
    nickname = '게스트',
    equippedTitle
}) => {
    const stats = useMemo(() => getUserStatsSummary(), [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-xl max-h-[90vh] bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 overflow-y-auto shadow-2xl text-white font-sans">
                {/* 닫기 버튼 */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-all"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* 모달 타이틀 */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
                        <Award className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black">나의 플레이 통계 대시보드</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400 font-bold">{nickname} 플레이어</span>
                            {equippedTitle && (
                                <span className="text-[10px] bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 px-2 py-0.5 rounded-full font-bold">
                                    🎖️ {equippedTitle}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 총 정답 수 하이라이트 대시보드 */}
                <div className="bg-gradient-to-br from-yellow-400/15 via-amber-500/10 to-transparent border border-yellow-400/30 rounded-2xl p-4 sm:p-5 mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-yellow-400/90 font-extrabold uppercase tracking-wider">누적 총 정답 수</p>
                        <p className="text-3xl sm:text-4xl font-black text-white font-mono mt-1">
                            {stats.grandTotalCorrect.toLocaleString()} <span className="text-sm font-bold text-gray-400">개</span>
                        </p>
                    </div>
                    <div className="text-right font-mono text-xs text-gray-400 space-y-1">
                        <p><span className="text-blue-400 font-bold">실전 타이핑:</span> {stats.totalCorrect.toLocaleString()}개</p>
                        <p><span className="text-emerald-400 font-bold">4지선다 연습:</span> {stats.practiceCorrectCount.toLocaleString()}개</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* 카드 1: 🏆 주요 레코드 성과 */}
                    <div className="bg-gray-950/60 border border-gray-800 rounded-2xl p-4 sm:p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy className="w-4 h-4 text-yellow-400" />
                            <h3 className="text-sm font-bold text-gray-300">주요 레코드 성과</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="bg-gray-900 border border-gray-800 p-3 rounded-xl">
                                <Target className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                                <p className="text-[11px] text-gray-400 font-bold">싱글 최고점</p>
                                <p className="text-lg font-black font-mono text-yellow-400">{stats.singleHighScore.toLocaleString()} <span className="text-xs">pts</span></p>
                            </div>
                            <div className="bg-gray-900 border border-gray-800 p-3 rounded-xl">
                                <Swords className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                                <p className="text-[11px] text-gray-400 font-bold">1v1 승리 / 연승</p>
                                <p className="text-lg font-black font-mono text-blue-400">{stats.multiplayerWins}승 <span className="text-xs text-gray-400">({stats.maxMultiplayerWinStreak}연승)</span></p>
                            </div>
                            <div className="bg-gray-900 border border-gray-800 p-3 rounded-xl">
                                <Flame className="w-4 h-4 text-rose-400 mx-auto mb-1" />
                                <p className="text-[11px] text-gray-400 font-bold">최고 콤보</p>
                                <p className="text-lg font-black font-mono text-rose-400">{stats.maxCombo} <span className="text-xs">Combo</span></p>
                            </div>
                        </div>
                    </div>

                    {/* 카드 2: ⚡ 반응 속도 & 힌트 성향 */}
                    <div className="bg-gray-950/60 border border-gray-800 rounded-2xl p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-400" />
                                <h3 className="text-sm font-bold text-gray-300">순발력 & 응답 성향</h3>
                            </div>
                            <span className="text-xs font-black bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-1 rounded-full">
                                {stats.speedTitle}
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="bg-gray-900 border border-gray-800 p-3 rounded-xl">
                                <p className="text-[11px] text-gray-400 font-bold">⚡ 초음속 (≤1.5초)</p>
                                <p className="text-base font-black font-mono text-amber-400">{stats.superFastCount}회</p>
                            </div>
                            <div className="bg-gray-900 border border-gray-800 p-3 rounded-xl">
                                <p className="text-[11px] text-gray-400 font-bold">🏃‍♂️ 번개 (≤2.5초)</p>
                                <p className="text-base font-black font-mono text-yellow-400">{stats.fastCount}회</p>
                            </div>
                            <div className="bg-gray-900 border border-gray-800 p-3 rounded-xl">
                                <HelpCircle className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
                                <p className="text-[11px] text-gray-400 font-bold">힌트 사용</p>
                                <p className="text-base font-black font-mono text-indigo-400">{stats.hintsUsedCount}회</p>
                            </div>
                        </div>
                    </div>

                    {/* 카드 3: 🚄 내가 가장 많이 맞힌 노선 TOP 3 */}
                    <div className="bg-gray-950/60 border border-gray-800 rounded-2xl p-4 sm:p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Train className="w-4 h-4 text-emerald-400" />
                            <h3 className="text-sm font-bold text-gray-300">최다 정답 노선 TOP 3</h3>
                        </div>

                        {stats.topLines.length === 0 ? (
                            <div className="text-center py-6 bg-gray-900/50 border border-gray-800/80 rounded-xl text-gray-500 text-xs">
                                아직 맞힌 노선 기록이 없습니다. 싱글 모드나 대전 모드를 플레이해 보세요!
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {stats.topLines.map((line, idx) => (
                                    <div key={line.lineId} className="bg-gray-900 border border-gray-800 p-3 rounded-xl flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 w-1/3">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                                                idx === 0 ? 'bg-yellow-400 text-gray-950' : idx === 1 ? 'bg-gray-300 text-gray-950' : 'bg-amber-600 text-white'
                                            }`}>
                                                {idx + 1}
                                            </span>
                                            <span
                                                className="px-2.5 py-1 rounded-full text-xs font-black text-white shadow-sm"
                                                style={{ backgroundColor: line.color }}
                                            >
                                                {line.name}
                                            </span>
                                        </div>

                                        <div className="flex-1">
                                            <div className="w-full bg-gray-950 rounded-full h-2 overflow-hidden border border-gray-800">
                                                <div
                                                    className="h-full transition-all duration-500 rounded-full"
                                                    style={{ backgroundColor: line.color, width: `${Math.max(line.percentage, 5)}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="text-right min-w-[70px]">
                                            <span className="font-mono font-bold text-sm text-white">{line.count}</span>
                                            <span className="text-[10px] text-gray-500 font-mono ml-1">({line.percentage}%)</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 닫기 버튼 하단 */}
                <div className="mt-8">
                    <button
                        onClick={onClose}
                        className="w-full py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-2xl transition-all shadow-lg text-sm"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
};
