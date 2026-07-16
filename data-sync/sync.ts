import axios from 'axios';
import {createClient} from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SEOUL_DATA_KEY = process.env.DATA_GO_KR_KEY!;

async function main() {
    console.log("🔄 서울 열린데이터광장 API 수집 가동...");
    try {
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

        // 서울시 2호선 순환선 전체 (시청 201 ~ 충정로 243 ➡️ 201 순환) 연결 엣지 자동 동적 생성
        const testEdges: { line_id: number; from_station_id: number; to_station_id: number }[] = [];

        for (let i = 201; i <= 243; i++) {
            const next = (i === 243) ? 201 : i + 1;

            // 내선 순환 엣지 추가
            testEdges.push({line_id: 2, from_station_id: i, to_station_id: next});
            // 외선 순환 엣지 추가
            testEdges.push({line_id: 2, from_station_id: next, to_station_id: i});
        }

        // 컬럼명 소문자화 및 충돌 방지 옵션 명시
        const {error: edgeError} = await supabase
            .from('station_connections')
            .upsert(testEdges, {onConflict: 'line_id,from_station_id,to_station_id'});

        if (edgeError) {
            throw new Error(`station_connections 테이블 적재 실패: ${edgeError.message} (코드: ${edgeError.code})`);
        }
        console.log(`✅ 2호선 순환선 전체 연결망 엣지 ${testEdges.length}개 주입 완료!`);
    } catch (err) {
        console.error("❌ 오류 발생:", err);
    }
}

main();