import { describe, it, expect, beforeEach } from 'vitest';
import { 
    hashPassword, 
    getAuthSession, 
    saveAuthSession, 
    logoutUser, 
    mergeAchievementData 
} from '../utils/auth';
import type { AuthUser, UserSession } from '../types/auth';
import { loadAchievementData, saveAchievementData } from '../utils/achievements';

describe('Auth & Cloud Sync Engine Tests', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('should hash passwords deterministically', async () => {
        const hash1 = await hashPassword('myPassword123');
        const hash2 = await hashPassword('myPassword123');
        const hashOther = await hashPassword('differentPass');

        expect(hash1).toBe(hash2);
        expect(hash1).not.toBe(hashOther);
        expect(hash1.length).toBeGreaterThan(10);
    });

    it('should save, retrieve, and clear authentication sessions', () => {
        expect(getAuthSession()).toBeNull();

        const dummyUser: AuthUser = {
            id: 'user-123-uuid',
            username: 'subway_tester',
            nickname: '테스터닉',
            equippedTitle: '초보 탑승객',
            unlockedAchievementIds: ['first_step'],
            unlockedDates: { 'first_step': '2026-08-10T00:00:00.000Z' },
            stats: {
                totalCorrect: 10,
                maxCombo: 5,
                singleHighScore: 1500,
                fastAnswerCount: 2,
                superFastAnswerCount: 1,
                singleGamesPlayed: 3,
                practiceCorrectCount: 5,
                multiplayerWins: 1,
                multiplayerWinStreak: 1,
                maxMultiplayerWinStreak: 1,
                hintsUsedCount: 1,
                allClearAchieved: false,
                lineCorrectCounts: { 2: 8 }
            }
        };

        const session: UserSession = {
            user: dummyUser,
            token: 'test-token-123',
            loggedInAt: '2026-08-10T00:00:00.000Z'
        };

        saveAuthSession(session);
        const loaded = getAuthSession();
        expect(loaded).not.toBeNull();
        expect(loaded?.user.username).toBe('subway_tester');
        expect(localStorage.getItem('subway_user_id')).toBe('user-123-uuid');
        expect(localStorage.getItem('subway_nickname')).toBe('테스터닉');

        logoutUser();
        expect(getAuthSession()).toBeNull();
    });

    it('should merge cloud achievements with local guest achievements without loss', () => {
        // 로컬 게스트 데이터 세팅 (로컬에서 딴 콤보와 업적)
        saveAchievementData({
            equippedTitle: '리듬 감각',
            unlockedIds: ['first_step', 'combo_3'],
            unlockedDates: { 'first_step': '2026-08-10', 'combo_3': '2026-08-10' },
            stats: {
                totalCorrect: 15,
                maxCombo: 8,
                singleHighScore: 2000,
                fastAnswerCount: 3,
                superFastAnswerCount: 0,
                singleGamesPlayed: 2,
                practiceCorrectCount: 0,
                multiplayerWins: 0,
                multiplayerWinStreak: 0,
                maxMultiplayerWinStreak: 0,
                hintsUsedCount: 0,
                allClearAchieved: false,
                lineCorrectCounts: { 2: 15 }
            }
        });

        // 클라우드 계정 데이터 (클라우드에서 딴 대전승리와 업적)
        const cloudUser: AuthUser = {
            id: 'cloud-user-uuid',
            username: 'cloud_master',
            nickname: '클라우드장인',
            equippedTitle: '승리의 첫맛',
            unlockedAchievementIds: ['first_step', 'first_win'],
            unlockedDates: { 'first_step': '2026-08-01', 'first_win': '2026-08-05' },
            stats: {
                totalCorrect: 50,
                maxCombo: 6,
                singleHighScore: 1800,
                fastAnswerCount: 1,
                superFastAnswerCount: 1,
                singleGamesPlayed: 5,
                practiceCorrectCount: 10,
                multiplayerWins: 5,
                multiplayerWinStreak: 2,
                maxMultiplayerWinStreak: 2,
                hintsUsedCount: 1,
                allClearAchieved: false,
                lineCorrectCounts: { 1: 20 }
            }
        };

        const merged = mergeAchievementData(cloudUser);

        // 합집합 검증
        expect(merged.unlockedIds).toContain('first_step');
        expect(merged.unlockedIds).toContain('combo_3');
        expect(merged.unlockedIds).toContain('first_win');
        expect(merged.unlockedIds.length).toBe(3);

        // 최대치 수치 병합 검증
        expect(merged.stats.totalCorrect).toBe(50); // max(15, 50)
        expect(merged.stats.maxCombo).toBe(8); // max(8, 6)
        expect(merged.stats.singleHighScore).toBe(2000); // max(2000, 1800)
        expect(merged.stats.multiplayerWins).toBe(5);
        expect(merged.stats.lineCorrectCounts[2]).toBe(15);
        expect(merged.stats.lineCorrectCounts[1]).toBe(20);

        const loadedLocal = loadAchievementData();
        expect(loadedLocal.unlockedIds.length).toBe(3);
    });
});
