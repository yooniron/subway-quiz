import { describe, it, expect } from 'vitest';
import { 
    SUBWAY_LINES, 
    REGION_TABS, 
    getLinesByRegion, 
    getLineById 
} from '../constants/lines';
import { 
    LINE_STATION_SEQUENCES, 
    generateQuizFromSequences, 
    getStationId 
} from '../data/nationalSubwayData';

describe('전국 28개 노선 및 지역별 탭 시스템 무결성 테스트', () => {
    it('총 28개 노선이 모두 고유한 ID와 색상, 지역 메타데이터를 가지고 정의되어 있어야 한다.', () => {
        expect(SUBWAY_LINES.length).toBe(28);

        const ids = SUBWAY_LINES.map(l => l.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(28);

        SUBWAY_LINES.forEach(line => {
            expect(line.id).toBeGreaterThan(0);
            expect(line.name.length).toBeGreaterThan(0);
            expect(line.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
            expect(line.region).toBeDefined();
            expect(line.regionName).toBeDefined();
        });
    });

    it('지역별 탭(REGION_TABS)이 6개 카테고리로 올바르게 필터링되어야 한다.', () => {
        expect(REGION_TABS.length).toBe(6);

        const seoulLines = getLinesByRegion('SEOUL');
        expect(seoulLines.length).toBe(9);

        const metroGtxLines = getLinesByRegion('METRO_GTX');
        expect(metroGtxLines.length).toBe(8);

        const busanLines = getLinesByRegion('BUSAN');
        expect(busanLines.length).toBe(6);

        const daeguLines = getLinesByRegion('DAEGU');
        expect(daeguLines.length).toBe(3);

        const daejeonGwangjuLines = getLinesByRegion('DAEJEON_GWANGJU');
        expect(daejeonGwangjuLines.length).toBe(2);

        const allLines = getLinesByRegion('ALL');
        expect(allLines.length).toBe(28);
    });

    it('28개 전 노선에 대한 역 시퀀스(LINE_STATION_SEQUENCES)가 4개 이상의 역을 포함해야 한다.', () => {
        SUBWAY_LINES.forEach(line => {
            const sequence = LINE_STATION_SEQUENCES[line.id];
            expect(sequence).toBeDefined();
            expect(sequence.length).toBeGreaterThanOrEqual(4);

            // 빈 역명이 없어야 함
            sequence.forEach(stName => {
                expect(typeof stName).toBe('string');
                expect(stName.trim().length).toBeGreaterThan(0);
            });
        });
    });

    it('generateQuizFromSequences가 특정 노선(예: 부산 2호선, GTX-A, 대전 1호선)을 지정했을 때 올바른 퀴즈 객체를 생성해야 한다.', () => {
        // 1. 부산 2호선 (id: 22)
        const busanQuiz = generateQuizFromSequences([22]);
        expect(busanQuiz.line_name).toBe('부산 2호선');
        expect(busanQuiz.color_code).toBe('#81BF48');
        expect(typeof busanQuiz.target_station_name).toBe('string');
        expect(busanQuiz.target_station_name.length).toBeGreaterThan(0);

        // 2. GTX-A (id: 18)
        const gtxQuiz = generateQuizFromSequences([18]);
        expect(gtxQuiz.line_name).toBe('GTX-A');
        expect(gtxQuiz.color_code).toBe('#9A6292');
        expect(typeof gtxQuiz.target_station_name).toBe('string');

        // 3. 대전 1호선 (id: 41)
        const daejeonQuiz = generateQuizFromSequences([41]);
        expect(daejeonQuiz.line_name).toBe('대전 1호선');
        expect(daejeonQuiz.color_code).toBe('#007448');

        // 4. 대구 1호선 (id: 31)
        const daeguQuiz = generateQuizFromSequences([31]);
        expect(daeguQuiz.line_name).toBe('대구 1호선');
        expect(daeguQuiz.color_code).toBe('#D93F30');
    });

    it('getLineById 함수가 노선 정보를 정상 조회해야 한다.', () => {
        const line = getLineById(11);
        expect(line).toBeDefined();
        expect(line?.name).toBe('신분당선');
        expect(line?.region).toBe('METRO_GTX');

        const unknown = getLineById(999);
        expect(unknown).toBeUndefined();
    });

    it('getStationId가 고유한 ID를 생성해야 한다.', () => {
        const id1 = getStationId(2, 5);
        const id2 = getStationId(21, 5);
        expect(id1).toBe(2005);
        expect(id2).toBe(21005);
        expect(id1).not.toBe(id2);
    });
});
