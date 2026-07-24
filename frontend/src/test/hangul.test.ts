import { describe, it, expect } from 'vitest';
import { getChoseong } from '../utils/hangul';

describe('한글 초성 추출 유틸리티 (getChoseong)', () => {
    it('한글 역명의 초성을 정확히 추출해야 합니다', () => {
        expect(getChoseong('강남역')).toBe('ㄱㄴㅇ');
        expect(getChoseong('홍대입구역')).toBe('ㅎㄷㅇㄱㅇ');
        expect(getChoseong('시청')).toBe('ㅅㅊ');
    });
});
