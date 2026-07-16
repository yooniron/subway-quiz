-- 1. 역 정보 마스터 테이블
CREATE TABLE stations (
  id INT PRIMARY KEY,
  station_name VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8)
);

-- 2. 지하철 노선 마스터 테이블
CREATE TABLE lines (
  id INT PRIMARY KEY,
  line_name VARCHAR(50) NOT NULL,
  color_code VARCHAR(7) NOT NULL
);

-- 3. 역 간 연결 관계 테이블 (인접 그래프 모델)
CREATE TABLE station_connections (
  id SERIAL PRIMARY KEY,
  line_id INT REFERENCES lines(id) ON DELETE CASCADE,
  from_station_id INT REFERENCES stations(id) ON DELETE CASCADE,
  to_station_id INT REFERENCES stations(id) ON DELETE CASCADE,
  CONSTRAINT unique_connection UNIQUE (line_id, from_station_id, to_station_id)
);

-- 4. 실시간 게임 대전방 테이블 (퀴즈 및 스코어 공유)
CREATE TABLE game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_1 UUID,
  player_2 UUID,
  status VARCHAR(20) DEFAULT 'WAITING', 
  p1_score INT DEFAULT 0,
  p2_score INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 현재 실시간 출제된 공통 퀴즈 정보
  quiz_target_id INT REFERENCES stations(id),
  quiz_target_name VARCHAR(100),
  quiz_line_name VARCHAR(50),
  quiz_color_code VARCHAR(7),
  quiz_left_2 VARCHAR(100),
  quiz_left_1 VARCHAR(100),
  quiz_right_1 VARCHAR(100),
  quiz_right_2 VARCHAR(100),
  quiz_created_at TIMESTAMPTZ
);

-- 기본 노선 데이터 마스터 테이블 인서트
INSERT INTO lines (id, line_name, color_code) VALUES
(1, '1호선', '#0052A4'),
(2, '2호선', '#00A84D'),
(3, '3호선', '#EF7C1C'),
(4, '4호선', '#00A5DE'),
(9, '9호선', '#BDB092');

-- [RPC 1] 실시간 퀴즈 생성 및 방 정보 업데이트 함수
CREATE OR REPLACE FUNCTION generate_next_quiz(p_room_id UUID)
RETURNS VOID AS $$
DECLARE
  v_target_id INT;
  v_line_id INT;
  v_target_name VARCHAR;
  v_line_name VARCHAR;
  v_color_code VARCHAR;
  
  -- 경로 추적용 변수
  v_l1 INT;
  v_l2 INT;
  v_r1 INT;
  v_r2 INT;
  
  v_l2_name VARCHAR;
  v_l1_name VARCHAR;
  v_r1_name VARCHAR;
  v_r2_name VARCHAR;
BEGIN
  -- 랜덤 엣지 선택을 통한 문제 추출
  SELECT from_station_id, line_id INTO v_target_id, v_line_id
  FROM station_connections
  ORDER BY random()
  LIMIT 1;

  -- 기본 메타데이터 조회
  SELECT station_name INTO v_target_name FROM stations WHERE id = v_target_id;
  SELECT line_name, color_code INTO v_line_name, v_color_code FROM lines WHERE id = v_line_id;

  -- 1) 첫 번째 방향 인접역(l1) 조회
  SELECT to_station_id INTO v_l1 
  FROM station_connections 
  WHERE from_station_id = v_target_id AND line_id = v_line_id
  ORDER BY to_station_id LIMIT 1;

  -- 2) 첫 번째 방향에서 1단계 더 전진한 역(l2) 조회 (Target 역 제외)
  IF v_l1 IS NOT NULL THEN
    SELECT to_station_id INTO v_l2 
    FROM station_connections 
    WHERE from_station_id = v_l1 AND line_id = v_line_id AND to_station_id != v_target_id
    LIMIT 1;
  END IF;

  -- 3) 두 번째 방향 인접역(r1) 조회
  SELECT to_station_id INTO v_r1 
  FROM station_connections 
  WHERE from_station_id = v_target_id AND line_id = v_line_id
  ORDER BY to_station_id DESC LIMIT 1;

  -- 4) 두 번째 방향에서 1단계 더 전진한 역(r2) 조회 (Target 역 제외)
  IF v_r1 IS NOT NULL AND v_r1 != v_l1 THEN
    SELECT to_station_id INTO v_r2 
    FROM station_connections 
    WHERE from_station_id = v_r1 AND line_id = v_line_id AND to_station_id != v_target_id
    LIMIT 1;
  ELSE
    -- 외선/내선 단축 또는 종착역인 경우 r1, r2는 null/l1 중복 해제
    v_r1 := NULL;
    v_r2 := NULL;
  END IF;

  -- 실제 역 명칭 조회
  SELECT station_name INTO v_l2_name FROM stations WHERE id = v_l2;
  SELECT station_name INTO v_l1_name FROM stations WHERE id = v_l1;
  SELECT station_name INTO v_r1_name FROM stations WHERE id = v_r1;
  SELECT station_name INTO v_r2_name FROM stations WHERE id = v_r2;

  -- 퀴즈 데이터 갱신
  UPDATE game_rooms 
  SET 
    quiz_target_id = v_target_id,
    quiz_target_name = v_target_name,
    quiz_line_name = v_line_name,
    quiz_color_code = v_color_code,
    quiz_left_2 = v_l2_name,
    quiz_left_1 = v_l1_name,
    quiz_right_1 = v_r1_name,
    quiz_right_2 = v_r2_name,
    quiz_created_at = NOW()
  WHERE id = p_room_id;
END;
$$ LANGUAGE plpgsql;

-- [RPC 2] 매치메이킹 조인 함수 개정 (매칭 완료 시 최초 퀴즈 자동 출제 포함)
CREATE OR REPLACE FUNCTION join_or_create_room(p_player_id UUID)
RETURNS TABLE (
  room_id UUID,
  player_role VARCHAR
) AS $$
DECLARE
  v_room_id UUID;
BEGIN
  SELECT id INTO v_room_id
  FROM game_rooms
  WHERE status = 'WAITING' AND player_1 != p_player_id
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE;

  IF v_room_id IS NOT NULL THEN
    UPDATE game_rooms
    SET 
      player_2 = p_player_id,
      status = 'PLAYING'
    WHERE id = v_room_id;
    
    -- 매칭이 완성되었으므로 최초 1회 퀴즈를 출제합니다.
    PERFORM generate_next_quiz(v_room_id);
    
    RETURN QUERY SELECT v_room_id, 'player_2'::VARCHAR;
  ELSE
    INSERT INTO game_rooms (player_1, status)
    VALUES (p_player_id, 'WAITING')
    RETURNING id INTO v_room_id;
    
    RETURN QUERY SELECT v_room_id, 'player_1'::VARCHAR;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- [RPC 3] 선착순 정답 처리 및 득점 처리 함수
CREATE OR REPLACE FUNCTION submit_answer(
  p_room_id UUID,
  p_player_id UUID,
  p_user_input VARCHAR,
  p_points INT
) RETURNS BOOLEAN AS $$
DECLARE
  v_target_name VARCHAR;
  v_player_1 UUID;
  v_player_2 UUID;
BEGIN
  -- 현재 출제된 정답 및 플레이어 정보 조회
  SELECT quiz_target_name, player_1, player_2 
  INTO v_target_name, v_player_1, v_player_2
  FROM game_rooms
  WHERE id = p_room_id FOR UPDATE;

  -- 사용자가 입력한 정답의 '역' 텍스트 제거 후 비교
  IF regexp_replace(p_user_input, '역$', '') = regexp_replace(v_target_name, '역$', '') THEN
    -- 점수 부여
    IF p_player_id = v_player_1 THEN
      UPDATE game_rooms SET p1_score = p1_score + p_points WHERE id = p_room_id;
    ELSIF p_player_id = v_player_2 THEN
      UPDATE game_rooms SET p2_score = p2_score + p_points WHERE id = p_room_id;
    END IF;

    -- 정답을 맞췄으므로 즉시 다음 퀴즈를 출제합니다.
    PERFORM generate_next_quiz(p_room_id);
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- 5. Row Level Security (RLS) 설정 및 공용 접근 허용 정책
-- =======================================================

-- RLS 비활성화 (익명 실시간 Realtime 소켓 전달 성능 보장)
ALTER TABLE stations DISABLE ROW LEVEL SECURITY;
ALTER TABLE lines DISABLE ROW LEVEL SECURITY;
ALTER TABLE station_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_rooms DISABLE ROW LEVEL SECURITY;

-- 1) stations: 모든 익명 사용자 읽기 허용 정책
CREATE POLICY "Allow public read on stations" ON stations
  FOR SELECT TO anon, authenticated USING (true);

-- 2) lines: 모든 익명 사용자 읽기 허용 정책
CREATE POLICY "Allow public read on lines" ON lines
  FOR SELECT TO anon, authenticated USING (true);

-- 3) station_connections: 모든 익명 사용자 읽기 허용 정책
CREATE POLICY "Allow public read on station_connections" ON station_connections
  FOR SELECT TO anon, authenticated USING (true);

-- 4) game_rooms: 모든 익명 사용자 읽기, 삽입, 갱신 허용 정책
CREATE POLICY "Allow public read on game_rooms" ON game_rooms
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public insert on game_rooms" ON game_rooms
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow public update on game_rooms" ON game_rooms
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- 5) game_rooms 테이블에 대한 실시간 변경 감지(Realtime) 게시 설정 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;