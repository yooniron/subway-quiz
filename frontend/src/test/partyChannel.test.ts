import { describe, it, expect } from 'vitest';
import { 
    type PartyPlayer, 
    type PartyRoomState, 
    type PartySubmitAnswerPayload,
    calculatePartyScore,
    sortPartyPlayers 
} from '../utils/partyRoom';

describe('Party Channel & Realtime State Synchronization Tests', () => {
    it('should correctly merge a new player joining via JOIN_PLAYER broadcast payload', () => {
        const initialRoom: PartyRoomState = {
            id: 'party_1234',
            title: '테스트 파티룸',
            inviteCode: 'PARTY-1234',
            isPrivate: false,
            selectedLineIds: [2],
            maxPlayers: 8,
            currentRound: 1,
            totalRounds: 10,
            status: 'WAITING',
            players: [
                { id: 'host_1', nickname: '방장', score: 0, isHost: true, isReady: true, hasAnswered: false, combo: 0 }
            ]
        };

        const newPlayer: PartyPlayer = {
            id: 'user_2',
            nickname: '참가자2',
            score: 0,
            isHost: false,
            isReady: false,
            hasAnswered: false,
            combo: 0
        };

        // 중복 가입 방지 및 상태 갱신 로직 검증
        const isDuplicate = initialRoom.players.some(p => p.id === newPlayer.id);
        const updatedPlayers = isDuplicate ? initialRoom.players : [...initialRoom.players, newPlayer];

        expect(updatedPlayers.length).toBe(2);
        expect(updatedPlayers[1].nickname).toBe('참가자2');
    });

    it('should update player score and rank when receiving SUBMIT_ANSWER broadcast payload', () => {
        const players: PartyPlayer[] = [
            { id: 'p1', nickname: '유저1', score: 100, isHost: true, isReady: true, hasAnswered: true, combo: 1 },
            { id: 'p2', nickname: '유저2', score: 0, isHost: false, isReady: true, hasAnswered: false, combo: 0 }
        ];

        const payload: PartySubmitAnswerPayload = {
            playerId: 'p2',
            nickname: '유저2',
            rank: 2,
            earnedScore: 80,
            round: 1
        };

        const nextPlayers = players.map(p => {
            if (p.id === payload.playerId) {
                return {
                    ...p,
                    score: p.score + payload.earnedScore,
                    combo: p.combo + 1,
                    hasAnswered: true,
                    rank: payload.rank
                };
            }
            return p;
        });

        const sorted = sortPartyPlayers(nextPlayers);
        expect(sorted[0].id).toBe('p1'); // 100pts
        expect(sorted[1].id).toBe('p2'); // 80pts
        expect(sorted[1].hasAnswered).toBe(true);
    });

    it('should remove a player when LEAVE_PLAYER payload or presence leave event occurs', () => {
        const players: PartyPlayer[] = [
            { id: 'p1', nickname: '유저1', score: 100, isHost: true, isReady: true, hasAnswered: true, combo: 1 },
            { id: 'p2', nickname: '유저2', score: 50, isHost: false, isReady: true, hasAnswered: true, combo: 1 }
        ];

        const remaining = players.filter(p => p.id !== 'p2');
        expect(remaining.length).toBe(1);
        expect(remaining[0].id).toBe('p1');
    });
});
