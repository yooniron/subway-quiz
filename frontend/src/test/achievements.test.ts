import { describe, it, expect, beforeEach } from 'vitest';
import {
    ACHIEVEMENTS_CONFIG,
    loadAchievementData,
    recordAnswerEvent,
    recordSingleScoreEvent,
    recordHintUsed,
    recordPracticeAnswer,
    recordMultiplayerResult,
    equipTitle,
    getEquippedTitle,
    getAchievementProgressList
} from '../utils/achievements';

describe('Achievements and Titles System Tests', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('should have exactly 30 achievements configured across 5 tiers', () => {
        expect(ACHIEVEMENTS_CONFIG.length).toBe(30);

        const bronzeCount = ACHIEVEMENTS_CONFIG.filter(a => a.tier === 'BRONZE').length;
        const silverCount = ACHIEVEMENTS_CONFIG.filter(a => a.tier === 'SILVER').length;
        const goldCount = ACHIEVEMENTS_CONFIG.filter(a => a.tier === 'GOLD').length;
        const platinumCount = ACHIEVEMENTS_CONFIG.filter(a => a.tier === 'PLATINUM').length;
        const diamondCount = ACHIEVEMENTS_CONFIG.filter(a => a.tier === 'DIAMOND').length;

        expect(bronzeCount).toBe(8);
        expect(silverCount).toBe(7);
        expect(goldCount).toBe(6);
        expect(platinumCount).toBe(5);
        expect(diamondCount).toBe(4);
    });

    it('should unlock first_step and combo_3 achievements on answer events', () => {
        const res1 = recordAnswerEvent({ lineId: 2, currentCombo: 1, responseTimeMs: 1200 });
        expect(res1.newlyUnlocked.some(a => a.id === 'first_step')).toBe(true);
        expect(res1.newlyUnlocked.some(a => a.id === 'speed_first')).toBe(true);

        const res2 = recordAnswerEvent({ lineId: 2, currentCombo: 3, responseTimeMs: 3000 });
        expect(res2.newlyUnlocked.some(a => a.id === 'combo_3')).toBe(true);

        const progress = getAchievementProgressList();
        const firstStep = progress.find(p => p.id === 'first_step');
        expect(firstStep?.isUnlocked).toBe(true);
    });

    it('should unlock hint_user on hint recording', () => {
        const res = recordHintUsed();
        expect(res.newlyUnlocked.some(a => a.id === 'hint_user')).toBe(true);
    });

    it('should unlock practice_10 after 10 practice answers', () => {
        for (let i = 0; i < 9; i++) {
            recordPracticeAnswer(2);
        }
        const progress = getAchievementProgressList();
        const ach = progress.find(p => p.id === 'practice_10');
        expect(ach?.isUnlocked).toBe(false);
        expect(ach?.currentProgress).toBe(9);

        const res = recordPracticeAnswer(2);
        expect(res.newlyUnlocked.some(a => a.id === 'practice_10')).toBe(true);
    });

    it('should unlock single score achievements properly (1000, 3000, 8000, 15000, 30000)', () => {
        const res1 = recordSingleScoreEvent(1200);
        expect(res1.newlyUnlocked.some(a => a.id === 'single_1000')).toBe(true);
        expect(res1.newlyUnlocked.some(a => a.id === 'single_3000')).toBe(false);

        const res2 = recordSingleScoreEvent(35000, true);
        expect(res2.newlyUnlocked.some(a => a.id === 'single_3000')).toBe(true);
        expect(res2.newlyUnlocked.some(a => a.id === 'single_8000')).toBe(true);
        expect(res2.newlyUnlocked.some(a => a.id === 'single_15000')).toBe(true);
        expect(res2.newlyUnlocked.some(a => a.id === 'single_30000')).toBe(true);
    });

    it('should allow equipping and unequipping titles', () => {
        expect(getEquippedTitle()).toBeNull();

        equipTitle('초보 탑승객');
        expect(getEquippedTitle()).toBe('초보 탑승객');

        equipTitle(null);
        expect(getEquippedTitle()).toBeNull();
    });

    it('should track multiplayer wins and streaks', () => {
        for (let i = 0; i < 5; i++) {
            recordMultiplayerResult(true);
        }
        const data = loadAchievementData();
        expect(data.stats.multiplayerWins).toBe(5);
        expect(data.stats.maxMultiplayerWinStreak).toBe(5);
        expect(data.unlockedIds.includes('first_win')).toBe(true);
    });
});
