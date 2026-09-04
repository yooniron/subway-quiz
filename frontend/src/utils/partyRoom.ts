export interface PartyPlayer {
    id: string;
    nickname: string;
    equippedTitle?: string | null;
    score: number;
    isHost: boolean;
    isReady: boolean;
    hasAnswered: boolean;
    combo: number;
    rank?: number;
    finishTimeMs?: number;
}

export interface PartyChatMessage {
    id: string;
    senderId: string;
    senderNickname: string;
    text: string;
    type: 'text' | 'preset' | 'emoji';
    timestamp: string;
}

export interface PartyRoomState {
    id: string;
    title: string;
    inviteCode: string;
    isPrivate: boolean;
    password?: string;
    selectedLineIds: number[];
    maxPlayers: number;
    currentRound: number;
    totalRounds: number;
    status: 'WAITING' | 'PLAYING' | 'FINISHED';
    players: PartyPlayer[];
}

/**
 * 6자리 파티룸 초대 코드 생성 유틸 (예: PARTY-8921)
 */
export function generatePartyInviteCode(): string {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `PARTY-${randomNum}`;
}

/**
 * 8인 순위 차등 점수 계산 유틸 (1-A 규칙)
 */
export function calculatePartyScore(rank: number, responseTimeMs: number): number {
    let baseScore = 30;
    if (rank === 1) baseScore = 100;
    else if (rank === 2) baseScore = 80;
    else if (rank === 3) baseScore = 60;
    else if (rank === 4) baseScore = 50;

    // 1등이면서 7초 이내 빠르게 맞히면 순발력 보너스 20pts
    if (rank === 1 && responseTimeMs <= 7000) {
        baseScore += 20;
    }

    return baseScore;
}

/**
 * 스포일러 차단 알림 문구 생성 유틸 (역이름 0% 노출)
 */
export function formatSpoilerFreeNotice(nickname: string, rank: number, score: number): string {
    return `🎉 [${nickname}]님이 ${rank}등으로 라운드를 통과하셨습니다! (+${score}pts)`;
}

/**
 * 파티 플레이어 순위 실시간 정렬 유틸
 */
export function sortPartyPlayers(players: PartyPlayer[]): PartyPlayer[] {
    return [...players].sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return b.combo - a.combo;
    });
}

export type PartyBroadcastEventType = 
    | 'JOIN_PLAYER' 
    | 'TOGGLE_READY' 
    | 'START_GAME' 
    | 'SUBMIT_ANSWER' 
    | 'SECRET_CHAT' 
    | 'NEXT_ROUND'
    | 'LEAVE_PLAYER';

export interface PartyJoinPayload {
    player: PartyPlayer;
}

export interface PartyToggleReadyPayload {
    playerId: string;
    isReady: boolean;
}

export interface PartyStartGamePayload {
    quizzes: any[];
}

export interface PartySubmitAnswerPayload {
    playerId: string;
    nickname: string;
    rank: number;
    earnedScore: number;
    round: number;
}

export interface PartySecretChatPayload {
    message: PartyChatMessage;
}

export interface PartyNextRoundPayload {
    nextRound: number;
}

export interface PartyLeavePayload {
    playerId: string;
}

