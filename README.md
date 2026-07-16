# 🚇 Subway Quiz (실시간 지하철 퀴즈 대전 플랫폼)

실시간 지하철 노선 네트워크 구조를 활용하여 1대1로 마주 보며 선착순으로 정답을 외쳐 점수를 획득하는 **양방향 실시간 스피드 경쟁 퀴즈 게임**입니다. 

---

## ⚡ 핵심 게임 시스템
1. **실시간 1대1 매치메이킹**: Supabase 데이터베이스 트랜잭션과 RPC 함수를 통해 대기 중인 플레이어를 실시간으로 즉각 매칭합니다.
2. **선착순 스피드 경쟁**: 기존의 루즈한 턴 방식을 과감히 폐기하고, 동시에 동일한 문제를 보며 먼저 정답을 타이핑한 유저가 즉시 득점하고 다음 문제로 동시 전환됩니다.
3. **물리적 정렬 보장 힌트**: 상/하행 전진 추적(Forward Tracking) 알고리즘을 SQL 프로시저 내에 심어, 인접역 힌트가 실제 서울 지하철 노선도와 일치하여 꼬임 없이 순서대로 노출됩니다.
4. **단계별 힌트 개방**:
    * **최초 출제 (30초 ~ 21초)**: 양 끝단의 2단계 인접역(`l2`, `r2`)이 기본 공개되어 힌트 유추를 돕습니다.
    * **시간 경과 (20초 ~ 11초)**: 정답 바로 양옆의 1단계 인접역들(`l1`, `r1`)이 추가로 드러납니다.
    * **최종 타임어택 (10초 이하)**: 정답 노드에 첫 글자 초성 힌트(예: `이○`, `합○○`)가 마스킹 처리되어 동적으로 오픈됩니다.
5. **Presence 기반 동적 세션 정리**:
    * 대기 중 방장이 탭을 닫으면 찌꺼기 룸 레코드가 DB에서 자동으로 청소(`DELETE`)됩니다.
    * 플레이 중 상대가 접속을 이탈하면 즉시 경고 팝업과 함께 대전을 종료(`FINISHED`)하고 메인 홈으로 돌려보냅니다.

---

## 🛠 기술 스택
* **Frontend**: React (TypeScript), Vite, Tailwind CSS, Lucide React, Canvas Confetti
* **Backend & DB**: Supabase (PostgreSQL, Realtime, Presence, RPC Functions)
* **Data Sync**: Node.js, Axios, tsx (서울교통공사 OpenAPI 연동)

---

## 🚀 빠른 시작 가이드 (Getting Started)

### 1단계: Supabase 데이터베이스 셋업
1. [supabase/schema.sql](./supabase/schema.sql)의 전체 쿼리를 복사하여 Supabase **SQL Editor**에서 실행합니다.
2. 실행 성공 후, 대시보드의 RLS 보안 제약 우회를 위해 아래 RLS 해제 쿼리를 추가 실행합니다:
    ```sql
    ALTER TABLE game_rooms DISABLE ROW LEVEL SECURITY;
    ALTER TABLE stations DISABLE ROW LEVEL SECURITY;
    ALTER TABLE lines DISABLE ROW LEVEL SECURITY;
    ALTER TABLE station_connections DISABLE ROW LEVEL SECURITY;
    ```

### 2단계: 데이터 동기화 및 2호선 순환망 주입
1. `data-sync/.env.example`을 참고하여 복사한 `data-sync/.env` 파일을 만들고 본인의 Supabase 및 서울 열린데이터광장 API Key를 입력합니다.
2. 데이터 동기화 모듈 실행:
    ```bash
    cd data-sync
    npm install
    npm run sync
    ```
    *(마스터 역 799개 적재 및 2호선 순환망 86개 연결 엣지가 적재됩니다.)*

### 3단계: 프론트엔드 구동
1. `frontend/.env.example`을 참고하여 `frontend/.env.local` 파일을 생성한 뒤 Supabase Anon Key와 URL을 입력합니다.
2. 프론트엔드 개발 서버 기동:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
