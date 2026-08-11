import type { UserAchievementData } from './achievement';

export interface AuthUser {
    id: string;
    username: string;
    nickname: string;
    equippedTitle: string | null;
    unlockedAchievementIds: string[];
    unlockedDates: Record<string, string>;
    stats: UserAchievementData['stats'];
}

export interface UserSession {
    user: AuthUser;
    token: string;
    loggedInAt: string;
}

export interface AuthResult {
    success: boolean;
    user?: AuthUser;
    errorMessage?: string;
}
