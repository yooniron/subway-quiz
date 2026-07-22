import { describe, it, expect } from 'vitest';

// 사용자가 입력한 역명 정규화 매칭 로직 시뮬레이션 테스트
function normalizeStationName(name: string): string {
    return name.trim().replace(/역$/, '');
}

describe('지하철 역명 정규화 매칭 유닛 테스트', () => {
    it('역명 끝의 "역" 텍스트가 정상적으로 제거되어야 합니다.', () => {
        expect(normalizeStationName('강남역')).toBe('강남');
        expect(normalizeStationName('신촌역')).toBe('신촌');
    });

    it('양 끝의 불필요한 공백이 제거되어야 합니다.', () => {
        expect(normalizeStationName('  홍대입구역  ')).toBe('홍대입구');
    });

    it('"역"으로 끝나지 않는 역명은 원래 이름을 유지해야 합니다.', () => {
        expect(normalizeStationName('서울역')).toBe('서울');
        expect(normalizeStationName('한양대')).toBe('한양대');
    });
});
