import type { Achievement, AchievementProgress, UserAchievementData } from '../types/achievement';

export const ACHIEVEMENTS_CONFIG: Achievement[] = [
    // 🥉 BRONZE (입문 & 초급자 전용 - 8종)
    {
        id: 'first_step',
        title: '첫 탑승',
        description: '첫 퀴즈 정답 1개 맞추기',
        category: 'PROGRESS',
        tier: 'BRONZE',
        rewardTitle: '초보 탑승객',
        icon: 'Train',
        maxProgress: 1
    },
    {
        id: 'combo_3',
        title: '리듬 타는 중',
        description: '3 콤보 달성',
        category: 'COMBO',
        tier: 'BRONZE',
        rewardTitle: '리듬 감각',
        icon: 'Sparkles',
        maxProgress: 3
    },
    {
        id: 'combo_5',
        title: '연승의 시작',
        description: '5 콤보 달성',
        category: 'COMBO',
        tier: 'BRONZE',
        rewardTitle: '콤보 입문자',
        icon: 'Flame',
        maxProgress: 5
    },
    {
        id: 'hint_user',
        title: '지혜로운 탐색',
        description: '싱글 모드에서 힌트 1회 사용',
        category: 'SPECIAL',
        tier: 'BRONZE',
        rewardTitle: '슬기로운 탐험가',
        icon: 'Lightbulb',
        maxProgress: 1
    },
    {
        id: 'speed_first',
        title: '번개 순발력',
        description: '2.5초 이내에 정답 1회 맞추기',
        category: 'SPEED',
        tier: 'BRONZE',
        rewardTitle: '순발력 꿈나무',
        icon: 'Zap',
        maxProgress: 1
    },
    {
        id: 'single_1000',
        title: '천점 돌파',
        description: '싱글 타임어택 1,000점 달성',
        category: 'PROGRESS',
        tier: 'BRONZE',
        rewardTitle: '천점 러너',
        icon: 'Award',
        maxProgress: 1000
    },
    {
        id: 'first_win',
        title: '첫 승리의 기쁨',
        description: '1v1 실시간 대전 1회 승리',
        category: 'SPECIAL',
        tier: 'BRONZE',
        rewardTitle: '승리의 첫맛',
        icon: 'Trophy',
        maxProgress: 1
    },
    {
        id: 'practice_10',
        title: '성실한 연습생',
        description: '연습 모드 10문제 정답 달성',
        category: 'PROGRESS',
        tier: 'BRONZE',
        rewardTitle: '성실한 연습생',
        icon: 'BookOpen',
        maxProgress: 10
    },

    // 🥈 SILVER (중급 탐험가 - 7종)
    {
        id: 'combo_15',
        title: '불꽃 콤보',
        description: '15 콤보 달성',
        category: 'COMBO',
        tier: 'SILVER',
        rewardTitle: '불꽃 콤보장인',
        icon: 'Flame',
        maxProgress: 15
    },
    {
        id: 'combo_25',
        title: '콤보 급행열차',
        description: '25 콤보 달성',
        category: 'COMBO',
        tier: 'SILVER',
        rewardTitle: '콤보 급행열차',
        icon: 'FastForward',
        maxProgress: 25
    },
    {
        id: 'single_3000',
        title: '스피드 러너',
        description: '싱글 타임어택 3,000점 돌파',
        category: 'PROGRESS',
        tier: 'SILVER',
        rewardTitle: '스피드 러너',
        icon: 'Gauge',
        maxProgress: 3000
    },
    {
        id: 'speed_20',
        title: '초음속 감각',
        description: '1.5초 이내 정답 20회 달성',
        category: 'SPEED',
        tier: 'SILVER',
        rewardTitle: '빛의 속도',
        icon: 'Zap',
        maxProgress: 20
    },
    {
        id: 'line_2_30',
        title: '2호선 순환러',
        description: '2호선 역 30개 정답 달성',
        category: 'LINES',
        tier: 'SILVER',
        rewardTitle: '2호선 정복자',
        icon: 'Compass',
        maxProgress: 30
    },
    {
        id: 'total_100',
        title: '지하철 백과사전',
        description: '누적 100문제 정답 달성',
        category: 'PROGRESS',
        tier: 'SILVER',
        rewardTitle: '지하철 가이드',
        icon: 'Map',
        maxProgress: 100
    },
    {
        id: 'multi_win_10',
        title: '결투의 강자',
        description: '1v1 대전 10회 승리 달성',
        category: 'SPECIAL',
        tier: 'SILVER',
        rewardTitle: '스피드 파이터',
        icon: 'Swords',
        maxProgress: 10
    },

    // 🥇 GOLD (상급 숙련자 - 6종)
    {
        id: 'combo_50',
        title: '콤보의 달인',
        description: '50 콤보 달성',
        category: 'COMBO',
        tier: 'GOLD',
        rewardTitle: '콤보 마스터',
        icon: 'Crown',
        maxProgress: 50
    },
    {
        id: 'single_8000',
        title: '스코어 어쌔신',
        description: '싱글 타임어택 8,000점 돌파',
        category: 'PROGRESS',
        tier: 'GOLD',
        rewardTitle: '스코어 어쌔신',
        icon: 'Target',
        maxProgress: 8000
    },
    {
        id: 'all_lines_20',
        title: '전 호선 섭렵',
        description: '1~9호선 각각 20문제 이상 정답',
        category: 'LINES',
        tier: 'GOLD',
        rewardTitle: '환승의 달인',
        icon: 'Layers',
        maxProgress: 5
    },
    {
        id: 'total_500',
        title: '수도권 철도왕',
        description: '누적 500문제 정답 달성',
        category: 'PROGRESS',
        tier: 'GOLD',
        rewardTitle: '수도권 철도왕',
        icon: 'Globe',
        maxProgress: 500
    },
    {
        id: 'speed_50',
        title: '인간 알파고',
        description: '1.5초 이내 정답 50회 달성',
        category: 'SPEED',
        tier: 'GOLD',
        rewardTitle: '초음속 뇌세포',
        icon: 'Cpu',
        maxProgress: 50
    },
    {
        id: 'multi_win_30',
        title: '무패의 파이터',
        description: '1v1 대전 30회 승리 & 5연승 달성',
        category: 'SPECIAL',
        tier: 'GOLD',
        rewardTitle: '무패 파이터',
        icon: 'Shield',
        maxProgress: 30
    },

    // 💎 PLATINUM (초상위권 장인 - 5종)
    {
        id: 'combo_100',
        title: '백발백중 100콤보',
        description: '단 한 번도 틀리지 않고 100 콤보 달성',
        category: 'COMBO',
        tier: 'PLATINUM',
        rewardTitle: '콤보의 제왕',
        icon: 'Flame',
        maxProgress: 100
    },
    {
        id: 'single_15000',
        title: '타임어택 챔피언',
        description: '싱글 타임어택 15,000점 돌파',
        category: 'PROGRESS',
        tier: 'PLATINUM',
        rewardTitle: '타임어택 챔피언',
        icon: 'Medal',
        maxProgress: 15000
    },
    {
        id: 'total_1500',
        title: '살아있는 사전',
        description: '누적 1,500문제 정답 돌파',
        category: 'PROGRESS',
        tier: 'PLATINUM',
        rewardTitle: '살아있는 지하철 사전',
        icon: 'Library',
        maxProgress: 1500
    },
    {
        id: 'multi_win_100',
        title: '대전의 패왕',
        description: '1v1 대전 100회 승리 달성',
        category: 'SPECIAL',
        tier: 'PLATINUM',
        rewardTitle: '전설의 승부사',
        icon: 'Trophy',
        maxProgress: 100
    },
    {
        id: 'all_lines_50',
        title: '수도권 완벽 횡단',
        description: '1~9호선 각각 50문제 이상 정답',
        category: 'LINES',
        tier: 'PLATINUM',
        rewardTitle: '환승의 신',
        icon: 'Network',
        maxProgress: 5
    },

    // 👑 DIAMOND (엔드게임 전설 - 4종)
    {
        id: 'combo_200',
        title: '불사조의 집중력',
        description: '무오답 200 콤보 돌파',
        category: 'COMBO',
        tier: 'DIAMOND',
        rewardTitle: '불사조의 뇌세포',
        icon: 'Infinity',
        maxProgress: 200
    },
    {
        id: 'single_30000',
        title: '시공간 왜곡자',
        description: '싱글 타임어택 30,000점 돌파',
        category: 'PROGRESS',
        tier: 'DIAMOND',
        rewardTitle: '시공간 왜곡자',
        icon: 'Hourglass',
        maxProgress: 30000
    },
    {
        id: 'total_3000',
        title: '전설의 대기관사',
        description: '누적 3,000문제 정답 돌파',
        category: 'PROGRESS',
        tier: 'DIAMOND',
        rewardTitle: '전설의 대기관사',
        icon: 'Star',
        maxProgress: 3000
    },
    {
        id: 'subway_god',
        title: '지하철의 신',
        description: '수도권 전 노선 올클리어 또는 2000정답 + 1v1 대전 200승 달성',
        category: 'SPECIAL',
        tier: 'DIAMOND',
        rewardTitle: '지하철의 신',
        icon: 'Crown',
        maxProgress: 200
    }
];

const STORAGE_KEY = 'subway_achievements_v1';

const defaultData: UserAchievementData = {
    equippedTitle: null,
    unlockedIds: [],
    unlockedDates: {},
    stats: {
        totalCorrect: 0,
        maxCombo: 0,
        singleHighScore: 0,
        fastAnswerCount: 0,
        superFastAnswerCount: 0,
        singleGamesPlayed: 0,
        practiceCorrectCount: 0,
        multiplayerWins: 0,
        multiplayerWinStreak: 0,
        maxMultiplayerWinStreak: 0,
        hintsUsedCount: 0,
        allClearAchieved: false,
        lineCorrectCounts: {}
    }
};

export function loadAchievementData(): UserAchievementData {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return { ...defaultData, stats: { ...defaultData.stats, lineCorrectCounts: {} } };
        const parsed = JSON.parse(saved);
        return {
            equippedTitle: parsed.equippedTitle ?? null,
            unlockedIds: Array.isArray(parsed.unlockedIds) ? parsed.unlockedIds : [],
            unlockedDates: parsed.unlockedDates ?? {},
            stats: {
                ...defaultData.stats,
                ...parsed.stats,
                lineCorrectCounts: parsed.stats?.lineCorrectCounts ?? {}
            }
        };
    } catch {
        return { ...defaultData, stats: { ...defaultData.stats, lineCorrectCounts: {} } };
    }
}

export function saveAchievementData(data: UserAchievementData): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save achievement data:', e);
    }
}

export function equipTitle(title: string | null): UserAchievementData {
    const data = loadAchievementData();
    data.equippedTitle = title;
    saveAchievementData(data);
    return data;
}

export function getEquippedTitle(): string | null {
    const data = loadAchievementData();
    return data.equippedTitle;
}

// 30종 업적 각각의 진행 수치 계산 헬퍼 함수
export function getAchievementCurrentProgress(achievementId: string, data: UserAchievementData): number {
    const { stats } = data;
    switch (achievementId) {
        // Bronze
        case 'first_step':
            return Math.min(1, stats.totalCorrect);
        case 'combo_3':
            return Math.min(3, stats.maxCombo);
        case 'combo_5':
            return Math.min(5, stats.maxCombo);
        case 'hint_user':
            return Math.min(1, stats.hintsUsedCount);
        case 'speed_first':
            return Math.min(1, stats.fastAnswerCount);
        case 'single_1000':
            return Math.min(1000, stats.singleHighScore);
        case 'first_win':
            return Math.min(1, stats.multiplayerWins);
        case 'practice_10':
            return Math.min(10, stats.practiceCorrectCount);

        // Silver
        case 'combo_15':
            return Math.min(15, stats.maxCombo);
        case 'combo_25':
            return Math.min(25, stats.maxCombo);
        case 'single_3000':
            return Math.min(3000, stats.singleHighScore);
        case 'speed_20':
            return Math.min(20, stats.superFastAnswerCount);
        case 'line_2_30':
            return Math.min(30, stats.lineCorrectCounts[2] || 0);
        case 'total_100':
            return Math.min(100, stats.totalCorrect);
        case 'multi_win_10':
            return Math.min(10, stats.multiplayerWins);

        // Gold
        case 'combo_50':
            return Math.min(50, stats.maxCombo);
        case 'single_8000':
            return Math.min(8000, stats.singleHighScore);
        case 'all_lines_20': {
            const count = [1, 2, 3, 4, 9].filter(id => (stats.lineCorrectCounts[id] || 0) >= 20).length;
            return count;
        }
        case 'total_500':
            return Math.min(500, stats.totalCorrect);
        case 'speed_50':
            return Math.min(50, stats.superFastAnswerCount);
        case 'multi_win_30':
            return Math.min(30, stats.multiplayerWins);

        // Platinum
        case 'combo_100':
            return Math.min(100, stats.maxCombo);
        case 'single_15000':
            return Math.min(15000, stats.singleHighScore);
        case 'total_1500':
            return Math.min(1500, stats.totalCorrect);
        case 'multi_win_100':
            return Math.min(100, stats.multiplayerWins);
        case 'all_lines_50': {
            const count = [1, 2, 3, 4, 9].filter(id => (stats.lineCorrectCounts[id] || 0) >= 50).length;
            return count;
        }

        // Diamond
        case 'combo_200':
            return Math.min(200, stats.maxCombo);
        case 'single_30000':
            return Math.min(30000, stats.singleHighScore);
        case 'total_3000':
            return Math.min(3000, stats.totalCorrect);
        case 'subway_god':
            return Math.min(200, stats.multiplayerWins);

        default:
            return 0;
    }
}

// 30종 전체 업적 리스트와 진행률 반환
export function getAchievementProgressList(customData?: UserAchievementData): AchievementProgress[] {
    const data = customData || loadAchievementData();
    return ACHIEVEMENTS_CONFIG.map(ach => {
        const currentProgress = getAchievementCurrentProgress(ach.id, data);
        const isUnlocked = data.unlockedIds.includes(ach.id);
        const unlockedAt = data.unlockedDates[ach.id] || null;
        return {
            ...ach,
            currentProgress,
            isUnlocked,
            unlockedAt
        };
    });
}

// 신규 해금 검사 헬퍼 함수
function evaluateAndUnlock(data: UserAchievementData): { updatedData: UserAchievementData; newlyUnlocked: Achievement[] } {
    const newlyUnlocked: Achievement[] = [];
    const now = new Date().toISOString();

    for (const ach of ACHIEVEMENTS_CONFIG) {
        if (data.unlockedIds.includes(ach.id)) continue;

        let shouldUnlock = false;
        const progress = getAchievementCurrentProgress(ach.id, data);

        if (ach.id === 'multi_win_30') {
            shouldUnlock = data.stats.multiplayerWins >= 30 && data.stats.maxMultiplayerWinStreak >= 5;
        } else if (ach.id === 'subway_god') {
            shouldUnlock = (data.stats.allClearAchieved || data.stats.totalCorrect >= 2000) && data.stats.multiplayerWins >= 200;
        } else {
            shouldUnlock = progress >= ach.maxProgress;
        }

        if (shouldUnlock) {
            data.unlockedIds.push(ach.id);
            data.unlockedDates[ach.id] = now;
            newlyUnlocked.push(ach);
        }
    }

    if (newlyUnlocked.length > 0) {
        saveAchievementData(data);
    }

    return { updatedData: data, newlyUnlocked };
}

// 1. 정답 이벤트 발생 시 호출
export function recordAnswerEvent(params: {
    lineId?: number;
    responseTimeMs?: number;
    currentCombo?: number;
}): { newlyUnlocked: Achievement[] } {
    const data = loadAchievementData();
    data.stats.totalCorrect += 1;

    if (params.lineId) {
        data.stats.lineCorrectCounts[params.lineId] = (data.stats.lineCorrectCounts[params.lineId] || 0) + 1;
    }

    if (params.currentCombo && params.currentCombo > data.stats.maxCombo) {
        data.stats.maxCombo = params.currentCombo;
    }

    if (params.responseTimeMs !== undefined) {
        if (params.responseTimeMs <= 2500) {
            data.stats.fastAnswerCount += 1;
        }
        if (params.responseTimeMs <= 1500) {
            data.stats.superFastAnswerCount += 1;
        }
    }

    saveAchievementData(data);
    return evaluateAndUnlock(data);
}

// 2. 싱글 모드 점수 갱신 이벤트 발생 시 호출
export function recordSingleScoreEvent(score: number, allClear: boolean = false): { newlyUnlocked: Achievement[] } {
    const data = loadAchievementData();
    data.stats.singleGamesPlayed += 1;

    if (score > data.stats.singleHighScore) {
        data.stats.singleHighScore = score;
    }

    if (allClear) {
        data.stats.allClearAchieved = true;
    }

    saveAchievementData(data);
    return evaluateAndUnlock(data);
}

// 3. 힌트 사용 이벤트 발생 시 호출
export function recordHintUsed(): { newlyUnlocked: Achievement[] } {
    const data = loadAchievementData();
    data.stats.hintsUsedCount += 1;
    saveAchievementData(data);
    return evaluateAndUnlock(data);
}

// 4. 연습 모드 정답 이벤트 발생 시 호출 (연습 전용 업적만 누적, 실전 칭호 분리)
export function recordPracticeAnswer(_lineId?: number): { newlyUnlocked: Achievement[] } {
    const data = loadAchievementData();
    data.stats.practiceCorrectCount += 1;

    saveAchievementData(data);
    return evaluateAndUnlock(data);
}

// 5. 1v1 대전 결과 이벤트 발생 시 호출
export function recordMultiplayerResult(won: boolean): { newlyUnlocked: Achievement[] } {
    const data = loadAchievementData();

    if (won) {
        data.stats.multiplayerWins += 1;
        data.stats.multiplayerWinStreak += 1;
        if (data.stats.multiplayerWinStreak > data.stats.maxMultiplayerWinStreak) {
            data.stats.maxMultiplayerWinStreak = data.stats.multiplayerWinStreak;
        }
    } else {
        data.stats.multiplayerWinStreak = 0;
    }

    saveAchievementData(data);
    return evaluateAndUnlock(data);
}
