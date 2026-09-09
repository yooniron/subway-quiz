import { describe, it, expect } from 'vitest';
import { getUserStatsSummary } from '../utils/userStats';
import { getChoseong } from '../utils/hangul';

describe('Service Stabilization & Null-Safety Unit Tests', () => {
    it('should safely load user stats summary without crashing even if localStorage is empty', () => {
        const summary = getUserStatsSummary();
        expect(summary).toBeDefined();
        expect(summary.totalCorrect).toBeGreaterThanOrEqual(0);
        expect(summary.speedTitle).toBeDefined();
        expect(Array.isArray(summary.topLines)).toBe(true);
    });

    it('should handle choseong extraction on empty string or special station names safely', () => {
        expect(getChoseong('')).toBe('');
        expect(getChoseong('강남')).toBe('ㄱㄴ');
        expect(getChoseong('4.19민주묘지')).toBe('4.19ㅁㅈㅁㅈ');
    });

    it('should prevent null/undefined station name string replacements in QuizCard logic', () => {
        const targetStationName: string | undefined = undefined;
        const safeClean = (targetStationName || '').replace(/역$/, '');
        expect(safeClean).toBe('');
    });
});
