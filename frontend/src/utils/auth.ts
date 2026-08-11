import { supabase } from '../lib/supabase';
import type { AuthUser, UserSession, AuthResult } from '../types/auth';
import { loadAchievementData, saveAchievementData } from './achievements';

const SESSION_KEY = 'subway_auth_session_v1';

/**
 * SHA-256 단방향 비밀번호 해싱 유틸
 */
export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + '_subway_salt_2026');

    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Node.js 또는 Fallback 환경용 간단 해시
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return 'fallback_hash_' + Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * 현재 활성화된 로그인 세션 조회
 */
export function getAuthSession(): UserSession | null {
    try {
        const saved = localStorage.getItem(SESSION_KEY);
        if (!saved) return null;
        return JSON.parse(saved);
    } catch {
        return null;
    }
}

/**
 * 로그인 세션 저장
 */
export function saveAuthSession(session: UserSession | null): void {
    try {
        if (session) {
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            // 기본 subway_user_id 및 subway_nickname도 동기화
            localStorage.setItem('subway_user_id', session.user.id);
            localStorage.setItem('subway_nickname', session.user.nickname);
        } else {
            localStorage.removeItem(SESSION_KEY);
        }
    } catch (e) {
        console.error('Failed to save auth session:', e);
    }
}

/**
 * 게스트 상태의 데이터와 클라우드 데이터 스마트 병합
 */
export function mergeAchievementData(cloudUser: AuthUser) {
    const local = loadAchievementData();

    // 1. 해금된 업적 ID 합집합
    const mergedUnlockedIds = Array.from(new Set([
        ...cloudUser.unlockedAchievementIds,
        ...local.unlockedIds
    ]));

    // 2. 해금 일시 병합 (더 빠른 날짜 우선)
    const mergedDates: Record<string, string> = {
        ...cloudUser.unlockedDates,
        ...local.unlockedDates
    };

    // 3. 통계 데이터 최대치 병합
    const mergedStats = {
        totalCorrect: Math.max(cloudUser.stats.totalCorrect || 0, local.stats.totalCorrect || 0),
        maxCombo: Math.max(cloudUser.stats.maxCombo || 0, local.stats.maxCombo || 0),
        singleHighScore: Math.max(cloudUser.stats.singleHighScore || 0, local.stats.singleHighScore || 0),
        fastAnswerCount: Math.max(cloudUser.stats.fastAnswerCount || 0, local.stats.fastAnswerCount || 0),
        superFastAnswerCount: Math.max(cloudUser.stats.superFastAnswerCount || 0, local.stats.superFastAnswerCount || 0),
        singleGamesPlayed: Math.max(cloudUser.stats.singleGamesPlayed || 0, local.stats.singleGamesPlayed || 0),
        practiceCorrectCount: Math.max(cloudUser.stats.practiceCorrectCount || 0, local.stats.practiceCorrectCount || 0),
        multiplayerWins: Math.max(cloudUser.stats.multiplayerWins || 0, local.stats.multiplayerWins || 0),
        multiplayerWinStreak: Math.max(cloudUser.stats.multiplayerWinStreak || 0, local.stats.multiplayerWinStreak || 0),
        maxMultiplayerWinStreak: Math.max(cloudUser.stats.maxMultiplayerWinStreak || 0, local.stats.maxMultiplayerWinStreak || 0),
        hintsUsedCount: Math.max(cloudUser.stats.hintsUsedCount || 0, local.stats.hintsUsedCount || 0),
        allClearAchieved: Boolean(cloudUser.stats.allClearAchieved || local.stats.allClearAchieved),
        lineCorrectCounts: {
            ...(cloudUser.stats.lineCorrectCounts || {}),
            ...(local.stats.lineCorrectCounts || {})
        }
    };

    const equippedTitle = cloudUser.equippedTitle || local.equippedTitle || null;

    const mergedData = {
        equippedTitle,
        unlockedIds: mergedUnlockedIds,
        unlockedDates: mergedDates,
        stats: mergedStats
    };

    saveAchievementData(mergedData);
    return mergedData;
}

/**
 * 3초 간편 익명 회원가입
 */
export async function registerUser(username: string, password: string, nickname: string): Promise<AuthResult> {
    try {
        const cleanUsername = username.trim().toLowerCase();
        const cleanNickname = nickname.trim();

        if (cleanUsername.length < 3) {
            return { success: false, errorMessage: '아이디는 3자 이상이어야 합니다.' };
        }
        if (password.length < 4) {
            return { success: false, errorMessage: '비밀번호는 4자 이상이어야 합니다.' };
        }
        if (cleanNickname.length < 2) {
            return { success: false, errorMessage: '닉네임은 2자 이상이어야 합니다.' };
        }

        const passwordHash = await hashPassword(password);
        const localData = loadAchievementData();

        const { data, error } = await supabase.rpc('register_user', {
            p_username: cleanUsername,
            p_password_hash: passwordHash,
            p_nickname: cleanNickname,
            p_initial_equipped_title: localData.equippedTitle,
            p_initial_unlocked_ids: localData.unlockedIds,
            p_initial_unlocked_dates: localData.unlockedDates,
            p_initial_stats: localData.stats
        });

        if (error) {
            return { success: false, errorMessage: error.message };
        }

        if (data && data.length > 0) {
            const row = data[0];
            if (row.error_message) {
                return { success: false, errorMessage: row.error_message };
            }

            const authUser: AuthUser = {
                id: row.id,
                username: row.username,
                nickname: row.nickname,
                equippedTitle: row.equipped_title,
                unlockedAchievementIds: row.unlocked_achievement_ids || [],
                unlockedDates: row.unlocked_dates || {},
                stats: row.stats || localData.stats
            };

            const session: UserSession = {
                user: authUser,
                token: 'sess_' + Date.now(),
                loggedInAt: new Date().toISOString()
            };

            saveAuthSession(session);
            mergeAchievementData(authUser);

            return { success: true, user: authUser };
        }

        return { success: false, errorMessage: '회원가입 응답이 올바르지 않습니다.' };
    } catch (e: any) {
        return { success: false, errorMessage: e.message || '회원가입 중 오류가 발생했습니다.' };
    }
}

/**
 * 사용자 로그인
 */
export async function loginUser(username: string, password: string): Promise<AuthResult> {
    try {
        const cleanUsername = username.trim().toLowerCase();
        if (!cleanUsername || !password) {
            return { success: false, errorMessage: '아이디와 비밀번호를 모두 입력해 주세요.' };
        }

        const passwordHash = await hashPassword(password);

        const { data, error } = await supabase.rpc('login_user', {
            p_username: cleanUsername,
            p_password_hash: passwordHash
        });

        if (error) {
            return { success: false, errorMessage: error.message };
        }

        if (data && data.length > 0) {
            const row = data[0];
            if (row.error_message) {
                return { success: false, errorMessage: row.error_message };
            }

            const authUser: AuthUser = {
                id: row.id,
                username: row.username,
                nickname: row.nickname,
                equippedTitle: row.equipped_title,
                unlockedAchievementIds: row.unlocked_achievement_ids || [],
                unlockedDates: row.unlocked_dates || {},
                stats: row.stats
            };

            const session: UserSession = {
                user: authUser,
                token: 'sess_' + Date.now(),
                loggedInAt: new Date().toISOString()
            };

            saveAuthSession(session);
            mergeAchievementData(authUser);

            // 클라우드와 최종 동기화
            await syncCloudProfile();

            return { success: true, user: authUser };
        }

        return { success: false, errorMessage: '로그인 응답이 올바르지 않습니다.' };
    } catch (e: any) {
        return { success: false, errorMessage: e.message || '로그인 중 오류가 발생했습니다.' };
    }
}

/**
 * 로그아웃 (게스트 모드로 전환)
 */
export function logoutUser(): void {
    saveAuthSession(null);
}

/**
 * 클라우드 프로필 실시간 동기화 (로그인 상태일 때 백그라운드 호출)
 */
export async function syncCloudProfile(): Promise<boolean> {
    const session = getAuthSession();
    if (!session) return false; // 게스트 상태는 로컬만 유지

    try {
        const localData = loadAchievementData();
        const currentNickname = localStorage.getItem('subway_nickname') || session.user.nickname;

        const { data, error } = await supabase.rpc('sync_user_profile', {
            p_user_id: session.user.id,
            p_nickname: currentNickname,
            p_equipped_title: localData.equippedTitle,
            p_unlocked_ids: localData.unlockedIds,
            p_unlocked_dates: localData.unlockedDates,
            p_stats: localData.stats
        });

        if (error) {
            console.error('Cloud sync error:', error);
            return false;
        }

        return Boolean(data);
    } catch (e) {
        console.error('Cloud sync exception:', e);
        return false;
    }
}
