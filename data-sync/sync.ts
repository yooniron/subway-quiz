import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SEOUL_DATA_KEY = process.env.DATA_GO_KR_KEY!;

// 외부 역코드(FR_CODE) 파싱 헬퍼 함수
function parseFrCode(fr: string) {
    if (!fr) return { prefix: "ZZZ", num: 999, sub: 999 };
    const match = fr.trim().match(/^([A-Z]*)([0-9]+)(-([0-9]+))?$/i);
    if (!match) return { prefix: fr, num: 0, sub: 0 };
    return {
        prefix: match[1] || "",
        num: parseInt(match[2]),
        sub: match[4] ? parseInt(match[4]) : 0
    };
}

async function main() {
    console.log("🔄 서울 열린데이터광장 API 수집 가동...");
    try {
        // 0. 1~9호선 라인 마스터 데이터 upsert 자동화 (색상 포함)
        const lineMasters = [
            { id: 1, line_name: '1호선', color_code: '#0052A4' },
            { id: 2, line_name: '2호선', color_code: '#00A84D' },
            { id: 3, line_name: '3호선', color_code: '#EF7C1C' },
            { id: 4, line_name: '4호선', color_code: '#00A5DE' },
            { id: 5, line_name: '5호선', color_code: '#996CAC' },
            { id: 6, line_name: '6호선', color_code: '#CD7C2F' },
            { id: 7, line_name: '7호선', color_code: '#747F28' },
            { id: 8, line_name: '8호선', color_code: '#E6186C' },
            { id: 9, line_name: '9호선', color_code: '#BDB092' }
        ];

        const { error: lineUpsertError } = await supabase
            .from('lines')
            .upsert(lineMasters);

        if (lineUpsertError) {
            console.warn("⚠️ lines 테이블 적재 실패:", lineUpsertError.message);
        } else {
            console.log("✅ 1~9호선 라인 마스터 데이터 적재 완료");
        }

        // 서울 열린데이터광장 SearchSTNBySubwayLineInfo API 호출 (JSON 형식, 1번부터 1000번역까지)
        const response = await axios.get(`http://openapi.seoul.go.kr:8088/${SEOUL_DATA_KEY}/json/SearchSTNBySubwayLineInfo/1/1000/`);

        const resultData = response.data?.SearchSTNBySubwayLineInfo;
        const items = resultData?.row || [];

        if (items.length === 0) {
            console.warn("⚠️ API 응답 데이터가 비어있거나 올바르지 않습니다. 응답 본문:", response.data);
        }

        for (const item of items) {
            const stationId = parseInt(item.STATION_CD);
            if (isNaN(stationId)) continue;

            // 컬럼명 소문자화 (id, station_name, latitude, longitude)
            const {error: upsertError} = await supabase.from('stations').upsert({
                id: stationId,
                station_name: item.STATION_NM,
                latitude: null,
                longitude: null
            });

            if (upsertError) {
                throw new Error(`stations 테이블 적재 실패: ${upsertError.message} (코드: ${upsertError.code})`);
            }
        }
        console.log(`✅ ${items.length}개 역 마스터 적재 완료 (서울시 데이터 규격)`);

        // 기존에 존재하던 인접역 엣지 데이터를 초기화(TRUNCATE 대용 삭제)하여 중복 제약 충돌 방지
        const {error: deleteError} = await supabase
            .from('station_connections')
            .delete()
            .gt('id', 0); // SERIAL PK가 1 이상인 모든 행 삭제

        if (deleteError) {
            console.warn("⚠️ 기존 엣지 데이터 삭제 실패 (무시하고 upsert 진행):", deleteError.message);
        } else {
            console.log("🧹 기존 인접역 엣지 테이블 청소 완료");
        }

        // 1~9호선 전 노선 엣지 관계 동적 추출
        const linesToProcess = ['01호선', '02호선', '03호선', '04호선', '05호선', '06호선', '07호선', '08호선', '09호선'];
        const testEdges: { line_id: number; from_station_id: number; to_station_id: number }[] = [];

        for (const lineStr of linesToProcess) {
            const lineId = parseInt(lineStr.substring(0, 2));
            const lineStations = items.filter((item: any) => item.LINE_NUM === lineStr && item.FR_CODE);

            // FR_CODE 기반 정밀 정렬
            lineStations.sort((a: any, b: any) => {
                const pa = parseFrCode(a.FR_CODE);
                const pb = parseFrCode(b.FR_CODE);
                if (pa.prefix !== pb.prefix) return pa.prefix.localeCompare(pb.prefix);
                if (pa.num !== pb.num) return pa.num - pb.num;
                return pa.sub - pb.sub;
            });

            // 기본 선형 엣지 생성 (양방향)
            for (let i = 0; i < lineStations.length - 1; i++) {
                const fromId = parseInt(lineStations[i].STATION_CD);
                const toId = parseInt(lineStations[i + 1].STATION_CD);
                if (isNaN(fromId) || isNaN(toId)) continue;

                const pa = parseFrCode(lineStations[i].FR_CODE);
                const pb = parseFrCode(lineStations[i + 1].FR_CODE);

                // 지선 분기로 인한 단순 인접 연결 이탈 차단 (prefix가 다를 시 엣지 생략)
                if (pa.prefix !== pb.prefix) {
                    continue;
                }

                testEdges.push({ line_id: lineId, from_station_id: fromId, to_station_id: toId });
                testEdges.push({ line_id: lineId, from_station_id: toId, to_station_id: fromId });
            }

            // 역명 해시맵 생성
            const nameToId = new Map<string, number>();
            lineStations.forEach((s: any) => {
                nameToId.set(s.STATION_NM, parseInt(s.STATION_CD));
            });

            const addManualEdge = (fromName: string, toName: string) => {
                const fId = nameToId.get(fromName);
                const tId = nameToId.get(toName);
                if (fId && tId) {
                    testEdges.push({ line_id: lineId, from_station_id: fId, to_station_id: tId });
                    testEdges.push({ line_id: lineId, from_station_id: tId, to_station_id: fId });
                }
            };

            // 교차 분기점 및 루프선 연결 보정
            if (lineId === 1) {
                addManualEdge("구로", "가산디지털단지");
            } else if (lineId === 2) {
                addManualEdge("충정로", "시청");
                addManualEdge("성수", "용답");
                addManualEdge("신도림", "도림천");
            } else if (lineId === 5) {
                addManualEdge("강동", "둔촌동");
            } else if (lineId === 6) {
                addManualEdge("구산", "응암");
            }
        }

        // 엣지 데이터의 고유 키(line_id, from_station_id, to_station_id) 기준으로 중복 제거
        const uniqueEdgesMap = new Map<string, typeof testEdges[0]>();
        for (const edge of testEdges) {
            const key = `${edge.line_id}_${edge.from_station_id}_${edge.to_station_id}`;
            uniqueEdgesMap.set(key, edge);
        }
        const finalEdges = Array.from(uniqueEdgesMap.values());

        // 컬럼명 소문자화 및 충돌 방지 옵션 명시
        const {error: edgeError} = await supabase
            .from('station_connections')
            .upsert(finalEdges, {onConflict: 'line_id,from_station_id,to_station_id'});

        if (edgeError) {
            throw new Error(`station_connections 테이블 적재 실패: ${edgeError.message} (코드: ${edgeError.code})`);
        }
        console.log(`✅ 1~9호선 노선망 전체 연결망 엣지 ${finalEdges.length}개 주입 완료!`);
    } catch (err) {
        console.error("❌ 오류 발생:", err);
    }
}

main();