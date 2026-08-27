import { describe, it, expect, beforeEach } from 'vitest';
import { getUserStatsSummary } from '../utils/userStats';
import { recordAnswerEvent, recordPracticeAnswer, recordSingleScoreEvent } from '../utils/achievements';

describe('User Stats Dashboard Tests', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('should return initial zero stats when no games played', () => {
        const stats = getUserStatsSummary();
        expect(stats.totalCorrect).toBe(0);
        expect(stats.practiceCorrectCount).toBe(0);
        expect(stats.grandTotalCorrect).toBe(0);
        expect(stats.singleHighScore).toBe(0);
        expect(stats.maxCombo).toBe(0);
        expect(stats.topLines.length).toBe(0);
        expect(stats.speedTitle).toContain('탐색가');
    });

    it('should accurately aggregate total answers and top 3 lines', () => {
        // Line 2 (2호선) 5회, Line 3 (3호선) 3회 정답 세팅
        for (let i = 0; i < 5; i++) {
            recordAnswerEvent({ lineId: 2, currentCombo: i + 1, responseTimeMs: 1200 });
        }
        for (let i = 0; i < 3; i++) {
            recordAnswerEvent({ lineId: 3, currentCombo: 1, responseTimeMs: 2000 });
        }
        recordPracticeAnswer(2); // 연습 모드 1개 추가

        const stats = getUserStatsSummary();
        expect(stats.totalCorrect).toBe(8);
        expect(stats.practiceCorrectCount).toBe(1);
        expect(stats.grandTotalCorrect).toBe(9);
        expect(stats.maxCombo).toBe(5);

        // TOP 3 노선 검증 (1위: 2호선 5개, 2위: 3호선 3개)
        expect(stats.topLines.length).toBe(2);
        expect(stats.topLines[0].name).toBe('2호선');
        expect(stats.topLines[0].count).toBe(5);
        expect(stats.topLines[0].percentage).toBe(63); // 5/8 = 62.5% -> 63%

        expect(stats.topLines[1].name).toBe('3호선');
        expect(stats.topLines[1].count).toBe(3);
        expect(stats.topLines[1].percentage).toBe(38); // 3/8 = 37.5% -> 38%
    });

    it('should assign speed title based on fast answer thresholds', () => {
        for (let i = 0; i < 10; i++) {
            recordAnswerEvent({ lineId: 1, responseTimeMs: 1000 }); // <= 1.5s
        }
        const stats = getUserStatsSummary();
        expect(stats.superFastCount).toBe(10);
        expect(stats.speedTitle).toContain('초음속');
    });
});
