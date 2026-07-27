-- ==========================================
-- 1. DDL: 역 정보 마스터 테이블 (멱등성 보장)
-- ==========================================
CREATE TABLE IF NOT EXISTS stations (
  id INT PRIMARY KEY,
  station_name VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8)
);

-- ==========================================
-- 2. DDL: 지하철 노선 마스터 테이블 (멱등성 보장)
-- ==========================================
CREATE TABLE IF NOT EXISTS lines (
  id INT PRIMARY KEY,
  line_name VARCHAR(50) NOT NULL,
  color_code VARCHAR(7) NOT NULL
);

-- ==========================================
-- 3. DDL: 역 간 연결 관계 테이블 (인접 그래프 모델)
-- ==========================================
CREATE TABLE IF NOT EXISTS station_connections (
  id SERIAL PRIMARY KEY,
  line_id INT REFERENCES lines(id) ON DELETE CASCADE,
  from_station_id INT REFERENCES stations(id) ON DELETE CASCADE,
  to_station_id INT REFERENCES stations(id) ON DELETE CASCADE
);

-- Unique Constraint 멱등 생성
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_connection'
  ) THEN
    ALTER TABLE station_connections ADD CONSTRAINT unique_connection UNIQUE (line_id, from_station_id, to_station_id);
  END IF;
END $$;

-- ==========================================
-- 4. DDL: 실시간 게임 대전방 테이블 (맞춤방 & 비공개 지원)
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
  invite_code VARCHAR(10),

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

-- Unique Constraint 멱등 생성
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'game_rooms_invite_code_key'
  ) THEN
    ALTER TABLE game_rooms ADD CONSTRAINT game_rooms_invite_code_key UNIQUE (invite_code);
  END IF;
END $$;

-- ==========================================
-- 🚨 [긴급 패치] 기존 game_rooms 테이블 누락 컬럼 자동 보장 멱등 마이그레이션
-- 기존 라이브 DB에 game_rooms가 옛 버전으로 존재하더라도 컬럼 누락 에러(column "room_password" does not exist 등) 원천 차단
-- ==========================================
DO $$ 
BEGIN 
  -- room_title
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='game_rooms' AND column_name='room_title') THEN
    ALTER TABLE game_rooms ADD COLUMN room_title VARCHAR(100) DEFAULT '즐거운 지하철 스피드 대전 방';
  END IF;

  -- selected_line_ids
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='game_rooms' AND column_name='selected_line_ids') THEN
    ALTER TABLE game_rooms ADD COLUMN selected_line_ids INT[];
  END IF;

  -- is_private
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='game_rooms' AND column_name='is_private') THEN
    ALTER TABLE game_rooms ADD COLUMN is_private BOOLEAN DEFAULT FALSE;
  END IF;

  -- room_password
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='game_rooms' AND column_name='room_password') THEN
    ALTER TABLE game_rooms ADD COLUMN room_password VARCHAR(50);
  END IF;

  -- invite_code
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='game_rooms' AND column_name='invite_code') THEN
    ALTER TABLE game_rooms ADD COLUMN invite_code VARCHAR(10);
  END IF;

  -- target_score
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='game_rooms' AND column_name='target_score') THEN
    ALTER TABLE game_rooms ADD COLUMN target_score INT DEFAULT 500;
  END IF;

  -- p2_ready
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='game_rooms' AND column_name='p2_ready') THEN
    ALTER TABLE game_rooms ADD COLUMN p2_ready BOOLEAN DEFAULT FALSE;
  END IF;

  -- p1_pass_requested
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='game_rooms' AND column_name='p1_pass_requested') THEN
    ALTER TABLE game_rooms ADD COLUMN p1_pass_requested BOOLEAN DEFAULT FALSE;
  END IF;

  -- p2_pass_requested
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='game_rooms' AND column_name='p2_pass_requested') THEN
    ALTER TABLE game_rooms ADD COLUMN p2_pass_requested BOOLEAN DEFAULT FALSE;
  END IF;

  -- p1_rematch_ready
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='game_rooms' AND column_name='p1_rematch_ready') THEN
    ALTER TABLE game_rooms ADD COLUMN p1_rematch_ready BOOLEAN DEFAULT FALSE;
  END IF;

  -- p2_rematch_ready
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='game_rooms' AND column_name='p2_rematch_ready') THEN
    ALTER TABLE game_rooms ADD COLUMN p2_rematch_ready BOOLEAN DEFAULT FALSE;
  END IF;

  -- quiz_target_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='game_rooms' AND column_name='quiz_target_id') THEN
    ALTER TABLE game_rooms ADD COLUMN quiz_target_id INT REFERENCES stations(id);
  END IF;

  -- quiz_target_name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='game_rooms' AND column_name='quiz_target_name') THEN
    ALTER TABLE game_rooms ADD COLUMN quiz_target_name VARCHAR(100);
  END IF;

  -- quiz_line_name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='game_rooms' AND column_name='quiz_line_name') THEN
    ALTER TABLE game_rooms ADD COLUMN quiz_line_name VARCHAR(50);
  END IF;

  -- quiz_color_code
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='game_rooms' AND column_name='quiz_color_code') THEN
    ALTER TABLE game_rooms ADD COLUMN quiz_color_code VARCHAR(7);
  END IF;

  -- quiz_left_2
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='game_rooms' AND column_name='quiz_left_2') THEN
    ALTER TABLE game_rooms ADD COLUMN quiz_left_2 VARCHAR(100);
  END IF;

  -- quiz_left_1
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='game_rooms' AND column_name='quiz_left_1') THEN
    ALTER TABLE game_rooms ADD COLUMN quiz_left_1 VARCHAR(100);
  END IF;

  -- quiz_right_1
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='game_rooms' AND column_name='quiz_right_1') THEN
    ALTER TABLE game_rooms ADD COLUMN quiz_right_1 VARCHAR(100);
  END IF;

  -- quiz_right_2
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='game_rooms' AND column_name='quiz_right_2') THEN
    ALTER TABLE game_rooms ADD COLUMN quiz_right_2 VARCHAR(100);
  END IF;

  -- quiz_created_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='game_rooms' AND column_name='quiz_created_at') THEN
    ALTER TABLE game_rooms ADD COLUMN quiz_created_at TIMESTAMPTZ;
  END IF;

  -- p1_last_seen
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='game_rooms' AND column_name='p1_last_seen') THEN
    ALTER TABLE game_rooms ADD COLUMN p1_last_seen TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- p2_last_seen
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='game_rooms' AND column_name='p2_last_seen') THEN
    ALTER TABLE game_rooms ADD COLUMN p2_last_seen TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- ==========================================
-- 5. DDL: 싱글모드 전역 랭킹 테이블 (호선 정보 포함)
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
