export type AchievementTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';

export type AchievementCategory = 'PROGRESS' | 'SPEED' | 'COMBO' | 'LINES' | 'SPECIAL';

export interface Achievement {
    id: string;
    title: string;
    description: string;
    category: AchievementCategory;
    tier: AchievementTier;
    rewardTitle: string;
    icon: string;
    maxProgress: number;
}

export interface AchievementProgress extends Achievement {
    currentProgress: number;
    isUnlocked: boolean;
    unlockedAt: string | null;
}

export interface UserAchievementData {
    equippedTitle: string | null;
    unlockedIds: string[];
    unlockedDates: Record<string, string>;
    stats: {
        totalCorrect: number;
        maxCombo: number;
        singleHighScore: number;
        fastAnswerCount: number; // answers within 2.5s
        superFastAnswerCount: number; // answers within 1.5s
        singleGamesPlayed: number;
        practiceCorrectCount: number;
        multiplayerWins: number;
        multiplayerWinStreak: number;
        maxMultiplayerWinStreak: number;
        hintsUsedCount: number;
        allClearAchieved: boolean;
        lineCorrectCounts: Record<number, number>; // lineId -> correct count
    };
}
