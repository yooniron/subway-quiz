import { describe, it, expect } from 'vitest';
import { 
    generatePartyInviteCode, 
    calculatePartyScore, 
    formatSpoilerFreeNotice, 
    sortPartyPlayers,
    type PartyPlayer 
} from '../utils/partyRoom';

describe('Party Room & Secret Chat Engine Tests', () => {
    it('should generate valid 6-character party invite codes', () => {
        const code = generatePartyInviteCode();
        expect(code).toMatch(/^PARTY-\d{4}$/);
    });

    it('should calculate differential rank scores accurately according to Rule 1-A', () => {
        expect(calculatePartyScore(1, 2500)).toBe(120); // 100 + 20 (under 3s)
        expect(calculatePartyScore(1, 5000)).toBe(100); // 100 (over 3s)
        expect(calculatePartyScore(2, 4000)).toBe(80);
        expect(calculatePartyScore(3, 4000)).toBe(60);
        expect(calculatePartyScore(4, 4000)).toBe(50);
        expect(calculatePartyScore(5, 4000)).toBe(30);
        expect(calculatePartyScore(8, 4000)).toBe(30);
    });

    it('should format spoiler-free notices without leaking station names', () => {
        const notice = formatSpoilerFreeNotice('지하철고수', 1, 120);
        expect(notice).toContain('지하철고수');
        expect(notice).toContain('1등');
        expect(notice).toContain('120pts');
        // 역 이름이 포함되지 않았는지 확인
        expect(notice).not.toContain('신도림');
        expect(notice).not.toContain('강남');
    });

    it('should sort party players descending by score and combo', () => {
        const dummyPlayers: PartyPlayer[] = [
            { id: 'p1', nickname: 'A', score: 100, isHost: true, isReady: true, hasAnswered: true, combo: 1 },
            { id: 'p2', nickname: 'B', score: 250, isHost: false, isReady: true, hasAnswered: true, combo: 3 },
            { id: 'p3', nickname: 'C', score: 180, isHost: false, isReady: true, hasAnswered: true, combo: 2 },
            { id: 'p4', nickname: 'D', score: 180, isHost: false, isReady: true, hasAnswered: true, combo: 5 }
        ];

        const sorted = sortPartyPlayers(dummyPlayers);
        expect(sorted[0].id).toBe('p2'); // 250pts
        expect(sorted[1].id).toBe('p4'); // 180pts, combo 5
        expect(sorted[2].id).toBe('p3'); // 180pts, combo 2
        expect(sorted[3].id).toBe('p1'); // 100pts
    });
});
