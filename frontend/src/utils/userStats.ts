import { loadAchievementData } from './achievements';
import { SUBWAY_LINES } from '../components/common/LineSelectorModal';

export interface TopLineStat {
    lineId: number;
    name: string;
    color: string;
    count: number;
    percentage: number;
}

export interface UserStatsSummary {
    totalCorrect: number;
    practiceCorrectCount: number;
    grandTotalCorrect: number;
    singleHighScore: number;
    singleGamesPlayed: number;
    multiplayerWins: number;
    maxMultiplayerWinStreak: number;
    maxCombo: number;
    superFastCount: number; // <= 1.5초
    fastCount: number;      // <= 2.5초
    hintsUsedCount: number;
    speedTitle: string;
    topLines: TopLineStat[];
}

export function getUserStatsSummary(): UserStatsSummary {
    const data = loadAchievementData();
    const stats = data.stats;

    const totalCorrect = stats.totalCorrect || 0;
    const practiceCorrectCount = stats.practiceCorrectCount || 0;
    const grandTotalCorrect = totalCorrect + practiceCorrectCount;

    // 노선별 정답 수 계산 및 상위 TOP 3 추출
    const lineCounts = stats.lineCorrectCounts || {};
    const totalLineCorrect = Object.values(lineCounts).reduce((acc, val) => acc + val, 0);

    const sortedLines: TopLineStat[] = Object.entries(lineCounts)
        .map(([lineIdStr, count]) => {
            const lineId = parseInt(lineIdStr, 10);
            const lineInfo = SUBWAY_LINES.find(l => l.id === lineId) || {
                id: lineId,
                name: `${lineId}호선`,
                color: '#6B7280'
            };
            const percentage = totalLineCorrect > 0 ? Math.round((count / totalLineCorrect) * 100) : 0;
            return {
                lineId,
                name: lineInfo.name,
                color: lineInfo.color,
                count,
                percentage
            };
        })
        .filter(l => l.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

    // 순발력 유형 칭호 산출
    const superFast = stats.superFastAnswerCount || 0;
    const fast = stats.fastAnswerCount || 0;

    let speedTitle = '신중한 지하철 탐색가 🧭';
    if (superFast >= 10) {
        speedTitle = '초음속 번개 기관사 ⚡';
    } else if (fast >= 10) {
        speedTitle = '스피드 러너 🏃‍♂️';
    } else if (totalCorrect >= 5) {
        speedTitle = '리드미컬 탑승객 🎵';
    }

    return {
        totalCorrect,
        practiceCorrectCount,
        grandTotalCorrect,
        singleHighScore: stats.singleHighScore || 0,
        singleGamesPlayed: stats.singleGamesPlayed || 0,
        multiplayerWins: stats.multiplayerWins || 0,
        maxMultiplayerWinStreak: stats.maxMultiplayerWinStreak || 0,
        maxCombo: stats.maxCombo || 0,
        superFastCount: superFast,
        fastCount: fast,
        hintsUsedCount: stats.hintsUsedCount || 0,
        speedTitle,
        topLines: sortedLines
    };
}
