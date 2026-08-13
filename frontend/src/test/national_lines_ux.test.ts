import { describe, it, expect } from 'vitest';
import { SUBWAY_LINES, getLinesByRegion } from '../constants/lines';
import { 
    LINE_STATION_SEQUENCES, 
    generateQuizFromSequences 
} from '../data/nationalSubwayData';

describe('🚄 전국 28개 노선 UX 및 퀴즈 출제 엔진 무결성 테스트', () => {
    it('전국 28개 전 노선에 대해 100% 퀴즈가 성공적으로 생성되어야 한다', () => {
        for (const line of SUBWAY_LINES) {
            const quiz = generateQuizFromSequences([line.id]);
            expect(quiz).toBeDefined();
            expect(quiz.target_station_name).toBeTruthy();
            expect(quiz.line_name).toBe(line.name);
            expect(quiz.color_code).toBe(line.color);
            expect(typeof quiz.target_station_id).toBe('number');
            // 인접역 힌트 중 최소 1개 이상 존재해야 함
            const hints = [quiz.left_2, quiz.left_1, quiz.right_1, quiz.right_2].filter(Boolean);
            expect(hints.length).toBeGreaterThan(0);
        }
    });

    it('지방 노선(부산/대구/대전/광주) 단독 선택 시 해당 지역 역만 정확히 출제되어야 한다', () => {
        // 부산 1호선 단독
        const busan1Quiz = generateQuizFromSequences([21]);
        expect(LINE_STATION_SEQUENCES[21]).toContain(busan1Quiz.target_station_name);

        // 부산 2호선 단독
        const busan2Quiz = generateQuizFromSequences([22]);
        expect(LINE_STATION_SEQUENCES[22]).toContain(busan2Quiz.target_station_name);

        // 대구 1호선 단독
        const daegu1Quiz = generateQuizFromSequences([31]);
        expect(LINE_STATION_SEQUENCES[31]).toContain(daegu1Quiz.target_station_name);

        // 대구 2호선 단독
        const daegu2Quiz = generateQuizFromSequences([32]);
        expect(LINE_STATION_SEQUENCES[32]).toContain(daegu2Quiz.target_station_name);

        // 대전 1호선 단독
        const daejeonQuiz = generateQuizFromSequences([41]);
        expect(LINE_STATION_SEQUENCES[41]).toContain(daejeonQuiz.target_station_name);

        // 광주 1호선 단독
        const gwangjuQuiz = generateQuizFromSequences([51]);
        expect(LINE_STATION_SEQUENCES[51]).toContain(gwangjuQuiz.target_station_name);

        // GTX-A 단독
        const gtxQuiz = generateQuizFromSequences([18]);
        expect(LINE_STATION_SEQUENCES[18]).toContain(gtxQuiz.target_station_name);
    });

    it('이전에 정답 처리된 역은 excludeStationNames를 통해 중복 출제되지 않아야 한다', () => {
        const lineId = 18; // GTX-A
        const allStations = [...LINE_STATION_SEQUENCES[18]];
        
        // 마지막 1개 역을 제외한 모든 역을 제외했을 때 남은 1개 역만 정확히 출제되는지 검증
        const lastStation = allStations[allStations.length - 1];
        const excluded = allStations.slice(0, allStations.length - 1);

        const quiz = generateQuizFromSequences([lineId], excluded);
        expect(quiz.target_station_name).toBe(lastStation);
    });

    it('지역별 탭(Region Tabs) 필터링이 28개 전 노선과 1:1로 일치해야 한다', () => {
        const seoul = getLinesByRegion('SEOUL');
        const metroGtx = getLinesByRegion('METRO_GTX');
        const busan = getLinesByRegion('BUSAN');
        const daegu = getLinesByRegion('DAEGU');
        const daejeonGwangju = getLinesByRegion('DAEJEON_GWANGJU');

        expect(seoul.length).toBe(9);
        expect(metroGtx.length).toBe(8);
        expect(busan.length).toBe(6);
        expect(daegu.length).toBe(3);
        expect(daejeonGwangju.length).toBe(2);

        const sum = seoul.length + metroGtx.length + busan.length + daegu.length + daejeonGwangju.length;
        expect(sum).toBe(28);
    });

    it('선택된 호선이 빈 배열([])일 때도 안전하게 기본 노선으로 폴백되어 에러 없이 퀴즈를 생성해야 한다', () => {
        const quiz = generateQuizFromSequences([]);
        expect(quiz).toBeDefined();
        expect(quiz.target_station_name).toBeTruthy();
    });
});
