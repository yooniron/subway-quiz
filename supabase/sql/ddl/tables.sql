-- ==========================================
-- 1. 역 정보 마스터 테이블
-- ==========================================
CREATE TABLE IF NOT EXISTS stations (
  id INT PRIMARY KEY,
  station_name VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8)
);

-- ==========================================
-- 2. 지하철 노선 마스터 테이블
-- ==========================================
CREATE TABLE IF NOT EXISTS lines (
  id INT PRIMARY KEY,
  line_name VARCHAR(50) NOT NULL,
  color_code VARCHAR(7) NOT NULL
);

-- ==========================================
-- 3. 역 간 연결 관계 테이블 (인접 그래프 모델)
-- ==========================================
CREATE TABLE IF NOT EXISTS station_connections (
  id SERIAL PRIMARY KEY,
  line_id INT REFERENCES lines(id) ON DELETE CASCADE,
  from_station_id INT REFERENCES stations(id) ON DELETE CASCADE,
  to_station_id INT REFERENCES stations(id) ON DELETE CASCADE,
  CONSTRAINT unique_connection UNIQUE (line_id, from_station_id, to_station_id)
);

-- ==========================================
-- 4. 실시간 게임 대전방 테이블 (맞춤방 & 비공개 지원)
-- ==========================================
CREATE TABLE IF NOT EXISTS game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_1 UUID,
  player_2 UUID,
  current_turn UUID,
  p1_score INT DEFAULT 0,
  p2_score INT DEFAULT 0,
  target_score INT DEFAULT 500,
  status VARCHAR(20) DEFAULT 'WAITING', 
  
  -- 대기실 레디/스타트 시스템
  p2_ready BOOLEAN DEFAULT FALSE,

  -- 스피드 패스 시스템
  p1_pass_requested BOOLEAN DEFAULT FALSE,
  p2_pass_requested BOOLEAN DEFAULT FALSE,

  -- 1대1 재경기 시스템
  p1_rematch_ready BOOLEAN DEFAULT FALSE,
  p2_rematch_ready BOOLEAN DEFAULT FALSE,

  -- 맞춤 방 및 비공개 방 설정
  room_title VARCHAR(100) DEFAULT '즐거운 지하철 스피드 대전 방',
  selected_line_ids INT[],
  is_private BOOLEAN DEFAULT FALSE,
  room_password VARCHAR(50),
  invite_code VARCHAR(10) UNIQUE,

  -- 퀴즈 데이터 칼럼
  quiz_target_id INT REFERENCES stations(id),
  quiz_target_name VARCHAR(100),
  quiz_line_name VARCHAR(50),
  quiz_color_code VARCHAR(7),
  quiz_left_2 VARCHAR(100),
  quiz_left_1 VARCHAR(100),
  quiz_right_1 VARCHAR(100),
  quiz_right_2 VARCHAR(100),
  quiz_created_at TIMESTAMPTZ,

  -- 핑 추적 및 세션 헬스체크
  p1_last_seen TIMESTAMPTZ DEFAULT NOW(),
  p2_last_seen TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. 싱글모드 전역 랭킹 테이블 (호선 정보 포함)
-- ==========================================
CREATE TABLE IF NOT EXISTS rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  score INT NOT NULL,
  line_ids INT[],               -- 플레이한 호선 목록
  line_summary VARCHAR(100),    -- 호선 요약 텍스트 (예: '2호선', '전체(1~9호선)')
  created_at TIMESTAMPTZ DEFAULT NOW()
);
