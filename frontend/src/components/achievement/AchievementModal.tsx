import React, { useState, useMemo } from 'react';
import { 
    X, Trophy, Crown, Flame, Sparkles, Zap, Award, BookOpen, Gauge, 
    Compass, Map, Swords, Target, Layers, Globe, Cpu, Shield, 
    Medal, Library, Network, Infinity as InfinityIcon, Hourglass, Star, CheckCircle2, Lock
} from 'lucide-react';
import type { AchievementTier, AchievementProgress } from '../../types/achievement';
import { getAchievementProgressList, equipTitle, getEquippedTitle } from '../../utils/achievements';

interface AchievementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTitleChange?: (title: string | null) => void;
}

const TIER_COLORS: Record<AchievementTier, {
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    glow: string;
    label: string;
    icon: string;
}> = {
    BRONZE: {
        bg: 'bg-amber-950/40',
        border: 'border-amber-700/50',
        text: 'text-amber-400',
        badgeBg: 'bg-amber-600/30 text-amber-300 border-amber-500/40',
        glow: 'shadow-[0_0_15px_rgba(217,119,6,0.2)]',
        label: '브론즈',
        icon: '🥉'
    },
    SILVER: {
        bg: 'bg-slate-900/60',
        border: 'border-slate-400/50',
        text: 'text-slate-200',
        badgeBg: 'bg-slate-400/30 text-slate-100 border-slate-300/40',
        glow: 'shadow-[0_0_15px_rgba(203,213,225,0.25)]',
        label: '실버',
        icon: '🥈'
    },
    GOLD: {
        bg: 'bg-yellow-950/50',
        border: 'border-yellow-400/60',
        text: 'text-yellow-300',
        badgeBg: 'bg-yellow-400/30 text-yellow-200 border-yellow-300/50',
        glow: 'shadow-[0_0_20px_rgba(250,204,21,0.35)]',
        label: '골드',
        icon: '🥇'
    },
    PLATINUM: {
        bg: 'bg-cyan-950/50',
        border: 'border-cyan-400/60',
        text: 'text-cyan-300',
        badgeBg: 'bg-cyan-400/30 text-cyan-200 border-cyan-300/50',
        glow: 'shadow-[0_0_20px_rgba(34,211,238,0.4)]',
        label: '플래티넘',
        icon: '💎'
    },
    DIAMOND: {
        bg: 'bg-gradient-to-br from-purple-950/60 via-pink-950/40 to-blue-950/60',
        border: 'border-pink-400/70',
        text: 'text-pink-300',
        badgeBg: 'bg-gradient-to-r from-pink-500/30 to-purple-500/30 text-pink-200 border-pink-300/50',
        glow: 'shadow-[0_0_25px_rgba(244,114,182,0.5)] animate-pulse',
        label: '다이아',
        icon: '👑'
    }
};

const getIconComponent = (iconName: string, className: string = "w-5 h-5") => {
    switch (iconName) {
        case 'Train': return <Compass className={className} />;
        case 'Sparkles': return <Sparkles className={className} />;
        case 'Flame': return <Flame className={className} />;
        case 'Lightbulb': return <Zap className={className} />;
        case 'Zap': return <Zap className={className} />;
        case 'Award': return <Award className={className} />;
        case 'Trophy': return <Trophy className={className} />;
        case 'BookOpen': return <BookOpen className={className} />;
        case 'FastForward': return <Zap className={className} />;
        case 'Gauge': return <Gauge className={className} />;
        case 'Compass': return <Compass className={className} />;
        case 'Map': return <Map className={className} />;
        case 'Swords': return <Swords className={className} />;
        case 'Crown': return <Crown className={className} />;
        case 'Target': return <Target className={className} />;
        case 'Layers': return <Layers className={className} />;
        case 'Globe': return <Globe className={className} />;
        case 'Cpu': return <Cpu className={className} />;
        case 'Shield': return <Shield className={className} />;
        case 'Medal': return <Medal className={className} />;
        case 'Library': return <Library className={className} />;
        case 'Network': return <Network className={className} />;
        case 'Infinity': return <InfinityIcon className={className} />;
        case 'Hourglass': return <Hourglass className={className} />;
        case 'Star': return <Star className={className} />;
        default: return <Award className={className} />;
    }
};

export const AchievementModal: React.FC<AchievementModalProps> = ({
    isOpen,
    onClose,
    onTitleChange
}) => {
    const [selectedTab, setSelectedTab] = useState<'ALL' | AchievementTier>('ALL');
    const [equippedTitleState, setEquippedTitleState] = useState<string | null>(() => getEquippedTitle());

    const achievements: AchievementProgress[] = useMemo(() => {
        if (!isOpen) return [];
        return getAchievementProgressList();
    }, [isOpen, equippedTitleState]);

    const unlockedCount = useMemo(() => {
        return achievements.filter(a => a.isUnlocked).length;
    }, [achievements]);

    const totalCount = achievements.length || 30;
    const progressPercent = Math.round((unlockedCount / totalCount) * 100);

    const filteredAchievements = useMemo(() => {
        if (selectedTab === 'ALL') return achievements;
        return achievements.filter(a => a.tier === selectedTab);
    }, [achievements, selectedTab]);

    const handleEquipTitle = (rewardTitle: string) => {
        const nextTitle = equippedTitleState === rewardTitle ? null : rewardTitle;
        equipTitle(nextTitle);
        setEquippedTitleState(nextTitle);
        if (onTitleChange) {
            onTitleChange(nextTitle);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="bg-gray-950 border-2 border-yellow-400/40 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(250,204,21,0.2)] relative overflow-hidden">
                
                {/* 상단 헤더 & 닫기 버튼 */}
                <div className="p-4 sm:p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/60 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400 shadow-md">
                            <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                                🏆 업적 & 칭호 보관함
                            </h2>
                            <p className="text-xs text-gray-400 font-medium">
                                도전 과제를 완료하고 전용 칭호를 획득하세요!
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={onClose}
                        className="p-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white transition-all cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 중앙 종합 달성률 & 장착 칭호 배너 */}
                <div className="p-4 sm:p-6 bg-gray-900/40 border-b border-gray-800/80 flex flex-col gap-3.5 shrink-0">
                    {/* 전체 달성률 바 */}
                    <div>
                        <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                            <span className="text-gray-300 flex items-center gap-1">
                                🌟 전체 업적 달성률
                            </span>
                            <span className="text-yellow-400 font-mono font-black">
                                {unlockedCount} / {totalCount} ({progressPercent}%)
                            </span>
                        </div>
                        <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden border border-white/10 relative">
                            <div 
                                className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 rounded-full transition-all duration-500 shadow-sm"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>

                    {/* 장착 중인 칭호 섹션 */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-950 border border-gray-800/80">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs text-gray-400 font-bold shrink-0">내 장착 칭호:</span>
                            {equippedTitleState ? (
                                <span className="px-3 py-1 bg-gradient-to-r from-yellow-400/20 to-amber-500/20 border border-yellow-400/40 text-yellow-300 text-xs font-black rounded-full shadow-sm truncate">
                                    ✨ [{equippedTitleState}]
                                </span>
                            ) : (
                                <span className="text-xs text-gray-600 font-medium italic">
                                    장착된 칭호 없음
                                </span>
                            )}
                        </div>

                        {equippedTitleState && (
                            <button
                                onClick={() => handleEquipTitle(equippedTitleState)}
                                className="px-2.5 py-1 text-[11px] font-bold text-gray-400 hover:text-red-400 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl transition-all shrink-0 cursor-pointer"
                            >
                                장착 해제
                            </button>
                        )}
                    </div>

                    {/* 티어별 탭 필터 */}
                    <div className="flex gap-1 sm:gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                        {(['ALL', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'] as const).map((tab) => {
                            const isSelected = selectedTab === tab;
                            const label = tab === 'ALL' 
                                ? `전체 (${achievements.length})` 
                                : `${TIER_COLORS[tab].icon} ${TIER_COLORS[tab].label} (${achievements.filter(a => a.tier === tab).length})`;

                            return (
                                <button
                                    key={tab}
                                    onClick={() => setSelectedTab(tab)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                        isSelected
                                            ? 'bg-yellow-400 text-gray-950 font-black shadow-md scale-105'
                                            : 'bg-gray-900/80 hover:bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-800'
                                    }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 업적 카드 그리드 리스트 */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 custom-scrollbar">
                    {filteredAchievements.map((ach) => {
                        const tierInfo = TIER_COLORS[ach.tier];
                        const isEquipped = equippedTitleState === ach.rewardTitle;
                        const percent = Math.min(100, Math.round((ach.currentProgress / ach.maxProgress) * 100));

                        return (
                            <div
                                key={ach.id}
                                className={`rounded-2xl p-3.5 sm:p-4 border transition-all relative flex flex-col justify-between ${
                                    ach.isUnlocked
                                        ? `${tierInfo.bg} ${tierInfo.border} ${tierInfo.glow} backdrop-blur-sm`
                                        : 'bg-gray-900/40 border-gray-800/80 opacity-75'
                                }`}
                            >
                                <div>
                                    {/* 상단 티어 뱃지 및 상태 */}
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${tierInfo.badgeBg}`}>
                                            <span>{tierInfo.icon}</span>
                                            <span>{tierInfo.label}</span>
                                        </span>

                                        {ach.isUnlocked ? (
                                            <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> 해금 완료
                                            </span>
                                        ) : (
                                            <span className="text-gray-500 text-xs font-bold flex items-center gap-1">
                                                <Lock className="w-3.5 h-3.5" /> 미달성
                                            </span>
                                        )}
                                    </div>

                                    {/* 업적 타이틀 & 설명 */}
                                    <div className="flex items-start gap-2.5 mb-2.5">
                                        <div className={`p-2 rounded-xl border shrink-0 ${
                                            ach.isUnlocked
                                                ? `${tierInfo.badgeBg} ${tierInfo.text}`
                                                : 'bg-gray-900 border-gray-800 text-gray-600'
                                        }`}>
                                            {getIconComponent(ach.icon, "w-4 h-4 sm:w-5 sm:h-5")}
                                        </div>

                                        <div className="min-w-0">
                                            <h3 className="text-sm font-black text-white truncate flex items-center gap-1">
                                                {ach.title}
                                            </h3>
                                            <p className="text-xs text-gray-400 font-medium leading-tight mt-0.5">
                                                {ach.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* 하단 보상 칭호 & 장착 버튼 / 프로그레스 바 */}
                                <div className="mt-2 pt-2.5 border-t border-white/5 flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1 min-w-0">
                                            <span className="text-[10px] text-gray-500 font-bold shrink-0">칭호:</span>
                                            <span className={`text-xs font-black truncate ${
                                                ach.isUnlocked ? tierInfo.text : 'text-gray-600'
                                            }`}>
                                                [{ach.rewardTitle}]
                                            </span>
                                        </div>

                                        {ach.isUnlocked ? (
                                            <button
                                                onClick={() => handleEquipTitle(ach.rewardTitle)}
                                                className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                                    isEquipped
                                                        ? 'bg-yellow-400 text-gray-950 shadow-md scale-105'
                                                        : 'bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700'
                                                }`}
                                            >
                                                {isEquipped ? '✓ 장착중' : '칭호 장착'}
                                            </button>
                                        ) : (
                                            <span className="text-[11px] font-mono font-bold text-gray-500">
                                                {ach.currentProgress} / {ach.maxProgress}
                                            </span>
                                        )}
                                    </div>

                                    {/* 미해금 시 프로그레스 게이지 */}
                                    {!ach.isUnlocked && (
                                        <div className="w-full h-1.5 bg-gray-950 rounded-full overflow-hidden border border-white/5">
                                            <div 
                                                className="h-full bg-yellow-400/60 rounded-full transition-all duration-300"
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
