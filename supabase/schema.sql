-- =======================================================
-- 0. 기존 테이블 및 함수 안전 소거 (재생성 멱등성 확보)
-- =======================================================
DROP TABLE IF EXISTS game_rooms CASCADE;
DROP TABLE IF EXISTS station_connections CASCADE;
DROP TABLE IF EXISTS lines CASCADE;
DROP TABLE IF EXISTS stations CASCADE;
DROP TABLE IF EXISTS rankings CASCADE;

DROP FUNCTION IF EXISTS generate_next_quiz(UUID);
DROP FUNCTION IF EXISTS join_or_create_room(UUID);
DROP FUNCTION IF EXISTS submit_answer(UUID, UUID, VARCHAR, INT);
DROP FUNCTION IF EXISTS request_rematch(UUID, UUID);
DROP FUNCTION IF EXISTS get_single_quiz();
DROP FUNCTION IF EXISTS get_active_lobbies();
DROP FUNCTION IF EXISTS create_custom_room(UUID, VARCHAR, INT[]);
DROP FUNCTION IF EXISTS create_custom_room(UUID, VARCHAR, INT[], BOOLEAN, VARCHAR);
DROP FUNCTION IF EXISTS join_room_by_code(VARCHAR, UUID);
DROP FUNCTION IF EXISTS verify_room_password(UUID, VARCHAR);

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
  room_title VARCHAR(100) DEFAULT '스피드 대전 방',
  player_1 UUID,
  player_2 UUID,
  status VARCHAR(20) DEFAULT 'WAITING', 
  p1_score INT DEFAULT 0,
  p2_score INT DEFAULT 0,
  target_score INT DEFAULT 500, -- 승리 목표 점수 (기본값: 500점)
  selected_line_ids INT[], -- 선택된 호선 그룹 배열 (옵션 A)
  is_private BOOLEAN DEFAULT FALSE,
  password VARCHAR(20) DEFAULT NULL,
  invite_code VARCHAR(10) UNIQUE,
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
  quiz_created_at TIMESTAMPTZ,
  last_scorer_id UUID,
  last_correct_answer VARCHAR(100),
  p1_rematch_ready BOOLEAN DEFAULT FALSE,
  p2_rematch_ready BOOLEAN DEFAULT FALSE,
  p1_ready BOOLEAN DEFAULT TRUE,
  p2_ready BOOLEAN DEFAULT FALSE,
  last_ping_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 노선 데이터 마스터 테이블 인서트
INSERT INTO lines (id, line_name, color_code) VALUES
(1, '1호선', '#0052A4'),
(2, '2호선', '#00A84D'),
(3, '3호선', '#EF7C1C'),
(4, '4호선', '#00A5DE'),
(9, '9호선', '#BDB092');

-- [RPC 1] 실시간 퀴즈 생성 및 방 정보 업데이트 함수 (호선 필터 반영)
CREATE OR REPLACE FUNCTION generate_next_quiz(p_room_id UUID)
RETURNS VOID AS $$
DECLARE
  v_selected_lines INT[];
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
  -- 방에 지정된 호선 필터 조건 가져오기
  SELECT selected_line_ids INTO v_selected_lines FROM game_rooms WHERE id = p_room_id;

  -- 무작위 엣지 선택 (지정된 호선 배열 내에서만 무작위 출제)
  IF v_selected_lines IS NULL OR cardinality(v_selected_lines) = 0 THEN
    SELECT from_station_id, line_id INTO v_target_id, v_line_id
    FROM station_connections
    ORDER BY random()
    LIMIT 1;
  ELSE
    SELECT from_station_id, line_id INTO v_target_id, v_line_id
    FROM station_connections
    WHERE line_id = ANY(v_selected_lines)
    ORDER BY random()
    LIMIT 1;
  END IF;

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

-- [RPC 2] 매치메이킹 입장 함수 개정 (동일 호선 조합 필터 매칭)
CREATE OR REPLACE FUNCTION join_or_create_room(
  p_player_id UUID,
  p_selected_line_ids INT[] DEFAULT NULL
)
RETURNS TABLE (
  room_id UUID,
  player_role VARCHAR
) AS $$
DECLARE
  v_room_id UUID;
BEGIN
  -- 동일한 호선 조합을 지정한 대기 방(WAITING) 추적
  SELECT id INTO v_room_id
  FROM game_rooms
  WHERE status = 'WAITING' 
    AND player_1 != p_player_id
    AND (
      selected_line_ids = p_selected_line_ids 
      OR (p_selected_line_ids IS NULL AND selected_line_ids IS NULL)
    )
    AND is_private = FALSE
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE;

  IF v_room_id IS NOT NULL THEN
    UPDATE game_rooms
    SET 
      player_2 = p_player_id,
      p2_ready = FALSE
    WHERE id = v_room_id;
    
    RETURN QUERY SELECT v_room_id, 'player_2'::VARCHAR;
  ELSE
    INSERT INTO game_rooms (player_1, status, selected_line_ids)
    VALUES (p_player_id, 'WAITING', p_selected_line_ids)
    RETURNING id INTO v_room_id;
    
    RETURN QUERY SELECT v_room_id, 'player_1'::VARCHAR;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- [RPC 2-1] 맞춤 방 생성 (커스텀 방 제목 + 출제 호선 지정 + 공개/비공개 + 비밀번호)
CREATE OR REPLACE FUNCTION create_custom_room(
  p_player_id UUID,
  p_room_title VARCHAR,
  p_selected_line_ids INT[] DEFAULT NULL,
  p_is_private BOOLEAN DEFAULT FALSE,
  p_password VARCHAR DEFAULT NULL,
  p_target_score INT DEFAULT 500
)
RETURNS TABLE (
  room_id UUID,
  player_role VARCHAR,
  invite_code VARCHAR
) AS $$
DECLARE
  v_room_id UUID;
  v_title VARCHAR;
  v_invite_code VARCHAR;
  v_pass VARCHAR;
  v_target INT;
BEGIN
  v_title := COALESCE(NULLIF(trim(p_room_title), ''), '즐거운 지하철 대전 방');
  v_pass := NULLIF(trim(p_password), '');
  v_target := COALESCE(p_target_score, 500);
  
  -- 6자리 고유 초대 코드 자동 생성 (예: A8K9F2)
  v_invite_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 6));

  INSERT INTO game_rooms (
    player_1, status, room_title, selected_line_ids,
    is_private, password, invite_code, target_score
  )
  VALUES (
    p_player_id, 'WAITING', v_title, p_selected_line_ids,
    COALESCE(p_is_private, FALSE), v_pass, v_invite_code, v_target
  )
  RETURNING id INTO v_room_id;
  
  RETURN QUERY SELECT v_room_id, 'player_1'::VARCHAR, v_invite_code;
END;
$$ LANGUAGE plpgsql;

-- [RPC 2-2] 특정 방 ID 직통 입장
CREATE OR REPLACE FUNCTION join_room_by_id(
  p_room_id UUID,
  p_player_id UUID
)
RETURNS TABLE (
  room_id UUID,
  player_role VARCHAR
) AS $$
DECLARE
  v_p1 UUID;
  v_p2 UUID;
  v_status VARCHAR;
BEGIN
  SELECT player_1, player_2, status INTO v_p1, v_p2, v_status
  FROM game_rooms
  WHERE id = p_room_id FOR UPDATE;

  IF v_status = 'WAITING' AND (v_p1 != p_player_id OR v_p1 IS NULL) THEN
    UPDATE game_rooms
    SET player_2 = p_player_id,
        p2_ready = FALSE
    WHERE id = p_room_id;

    RETURN QUERY SELECT p_room_id, 'player_2'::VARCHAR;
  ELSIF v_p1 = p_player_id THEN
    RETURN QUERY SELECT p_room_id, 'player_1'::VARCHAR;
  ELSIF v_p2 = p_player_id THEN
    RETURN QUERY SELECT p_room_id, 'player_2'::VARCHAR;
  ELSE
    RAISE EXCEPTION '이미 풀방이거나 접속할 수 없는 대전방입니다.';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- [RPC 2-2-B] 6자리 초대 코드로 입장
CREATE OR REPLACE FUNCTION join_room_by_code(
  p_invite_code VARCHAR,
  p_player_id UUID
)
RETURNS TABLE (
  room_id UUID,
  player_role VARCHAR,
  is_private BOOLEAN,
  has_password BOOLEAN
) AS $$
DECLARE
  v_room_id UUID;
  v_p1 UUID;
  v_p2 UUID;
  v_status VARCHAR;
  v_is_private BOOLEAN;
  v_has_password BOOLEAN;
  v_code VARCHAR;
BEGIN
  v_code := UPPER(trim(p_invite_code));
  
  SELECT id, player_1, player_2, status, COALESCE(is_private, FALSE), (password IS NOT NULL AND password != '')
  INTO v_room_id, v_p1, v_p2, v_status, v_is_private, v_has_password
  FROM game_rooms
  WHERE UPPER(invite_code) = v_code FOR UPDATE;

  IF v_room_id IS NULL THEN
    RAISE EXCEPTION '해당 초대 코드의 방이 존재하지 않습니다.';
  END IF;

  IF v_status != 'WAITING' THEN
    RAISE EXCEPTION '이미 대전이 진행 중이거나 종료된 대전방입니다.';
  END IF;

  IF v_p1 = p_player_id THEN
    RETURN QUERY SELECT v_room_id, 'player_1'::VARCHAR, v_is_private, v_has_password;
    RETURN;
  END IF;

  IF v_p2 = p_player_id THEN
    RETURN QUERY SELECT v_room_id, 'player_2'::VARCHAR, v_is_private, v_has_password;
    RETURN;
  END IF;

  IF v_p2 IS NOT NULL THEN
    RAISE EXCEPTION '해당 대전방은 이미 정원이 가득 찼습니다.';
  END IF;

  RETURN QUERY SELECT v_room_id, 'player_2'::VARCHAR, v_is_private, v_has_password;
END;
$$ LANGUAGE plpgsql;

-- [RPC 2-2-C] 비공개 방 비밀번호 검증
CREATE OR REPLACE FUNCTION verify_room_password(
  p_room_id UUID,
  p_password VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
  v_real_password VARCHAR;
  v_is_private BOOLEAN;
BEGIN
  SELECT password, COALESCE(is_private, FALSE) INTO v_real_password, v_is_private
  FROM game_rooms
  WHERE id = p_room_id;

  IF NOT v_is_private OR v_real_password IS NULL OR v_real_password = '' THEN
    RETURN TRUE;
  END IF;

  RETURN v_real_password = trim(p_password);
END;
$$ LANGUAGE plpgsql;

-- [RPC 2-3] 로비 용 실시간 대기방/대전방 목록 조회
CREATE OR REPLACE FUNCTION get_active_lobbies()
RETURNS TABLE (
  id UUID,
  room_title VARCHAR,
  player_1 UUID,
  player_2 UUID,
  status VARCHAR,
  selected_line_ids INT[],
  player_count INT,
  created_at TIMESTAMPTZ,
  is_private BOOLEAN,
  has_password BOOLEAN,
  invite_code VARCHAR,
  target_score INT
) AS $$
BEGIN
  -- 1) 90초 이상 백그라운드 핑이 누락된 유령 방을 CANCELLED 처리로 파기 (자가치유, 백그라운드 탭 스로틀링 방지)
  UPDATE game_rooms AS gr
  SET status = 'CANCELLED'
  WHERE gr.status IN ('WAITING', 'PLAYING', 'FINISHED')
    AND gr.last_ping_at < NOW() - INTERVAL '90 seconds';

  -- 2) 활성 로비 목록 조회 리턴
  RETURN QUERY
  SELECT 
    g.id,
    g.room_title,
    g.player_1,
    g.player_2,
    g.status,
    g.selected_line_ids,
    (CASE WHEN g.player_2 IS NOT NULL THEN 2 WHEN g.player_1 IS NOT NULL THEN 1 ELSE 0 END)::INT AS player_count,
    g.created_at,
    COALESCE(g.is_private, FALSE) AS is_private,
    (g.password IS NOT NULL AND g.password != '') AS has_password,
    g.invite_code,
    COALESCE(g.target_score, 500)::INT AS target_score
  FROM game_rooms g
  WHERE (
    g.status = 'WAITING' 
    AND g.created_at >= NOW() - INTERVAL '15 minutes'
    AND (g.player_1 IS NOT NULL OR g.player_2 IS NOT NULL)
  ) OR (
    g.status = 'PLAYING' 
    AND g.created_at >= NOW() - INTERVAL '2 hours'
  )
  ORDER BY 
    CASE WHEN g.status = 'WAITING' THEN 0 ELSE 1 END ASC,
    g.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- [RPC 2-4] 대기실 참가자 준비(Ready) 토글
CREATE OR REPLACE FUNCTION toggle_player_ready(
  p_room_id UUID,
  p_player_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_p1 UUID;
  v_p2 UUID;
  v_current_ready BOOLEAN;
BEGIN
  SELECT player_1, player_2, p2_ready INTO v_p1, v_p2, v_current_ready
  FROM game_rooms
  WHERE id = p_room_id FOR UPDATE;

  IF p_player_id = v_p2 THEN
    UPDATE game_rooms
    SET p2_ready = NOT v_current_ready
    WHERE id = p_room_id;
    RETURN NOT v_current_ready;
  ELSIF p_player_id = v_p1 THEN
    UPDATE game_rooms
    SET p1_ready = TRUE
    WHERE id = p_room_id;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- [RPC 2-5] 방장 수동 게임 시작 (Ready 완료 시 START 버튼 가동)
CREATE OR REPLACE FUNCTION start_game_by_host(
  p_room_id UUID,
  p_player_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_p1 UUID;
  v_p2 UUID;
  v_p2_ready BOOLEAN;
BEGIN
  SELECT player_1, player_2, p2_ready INTO v_p1, v_p2, v_p2_ready
  FROM game_rooms
  WHERE id = p_room_id FOR UPDATE;

  -- 방장이고 상대방이 입장 및 Ready 완료된 상태인 경우
  IF p_player_id = v_p1 AND v_p2 IS NOT NULL AND v_p2_ready = TRUE THEN
    UPDATE game_rooms
    SET status = 'PLAYING'
    WHERE id = p_room_id;

    PERFORM generate_next_quiz(p_room_id);
    RETURN TRUE;
  END IF;

  RETURN FALSE;
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
  v_p1_final INT;
  v_p2_final INT;
BEGIN
  -- 현재 출제된 정답 및 플레이어 정보 조회
  SELECT quiz_target_name, player_1, player_2 
  INTO v_target_name, v_player_1, v_player_2
  FROM game_rooms
  WHERE id = p_room_id FOR UPDATE;

  -- 사용자가 입력한 정답의 '역' 텍스트 제거 후 비교
  IF regexp_replace(p_user_input, '역$', '') = regexp_replace(v_target_name, '역$', '') THEN
    -- 점수 부여 및 스코어러 정보 기록
    IF p_player_id = v_player_1 THEN
      UPDATE game_rooms 
      SET p1_score = p1_score + p_points,
          last_scorer_id = p_player_id,
          last_correct_answer = v_target_name
      WHERE id = p_room_id;
    ELSIF p_player_id = v_player_2 THEN
      UPDATE game_rooms 
      SET p2_score = p2_score + p_points,
          last_scorer_id = p_player_id,
          last_correct_answer = v_target_name
      WHERE id = p_room_id;
    END IF;

    -- 최종 득점 현황 재확인
    SELECT p1_score, p2_score INTO v_p1_final, v_p2_final FROM game_rooms WHERE id = p_room_id;

    IF v_p1_final >= 1000 OR v_p2_final >= 1000 THEN
      UPDATE game_rooms SET status = 'FINISHED' WHERE id = p_room_id;
    ELSE
      -- 1000점 미만일 때만 즉시 다음 퀴즈를 출제
      PERFORM generate_next_quiz(p_room_id);
    END IF;

    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- [RPC 4] 신설: 재경기(Rematch) 수락 처리 함수
CREATE OR REPLACE FUNCTION request_rematch(
  p_room_id UUID,
  p_player_id UUID
) RETURNS VOID AS $$
DECLARE
  v_player_1 UUID;
  v_player_2 UUID;
  v_p1_ready BOOLEAN;
  v_p2_ready BOOLEAN;
BEGIN
  -- 플레이어 정보 및 현재 준비 상태 잠금 조회
  SELECT player_1, player_2, p1_rematch_ready, p2_rematch_ready
  INTO v_player_1, v_player_2, v_p1_ready, v_p2_ready
  FROM game_rooms
  WHERE id = p_room_id FOR UPDATE;

  -- 요청한 플레이어 슬롯에 맞춰 준비 상태 TRUE 설정
  IF p_player_id = v_player_1 THEN
    UPDATE game_rooms SET p1_rematch_ready = TRUE WHERE id = p_room_id;
    v_p1_ready := TRUE;
  ELSIF p_player_id = v_player_2 THEN
    UPDATE game_rooms SET p2_rematch_ready = TRUE WHERE id = p_room_id;
    v_p2_ready := TRUE;
  END IF;

  -- 양사 모두 동의한 경우 세션 즉시 리셋 후 재구동
  IF v_p1_ready = TRUE AND v_p2_ready = TRUE THEN
    UPDATE game_rooms
    SET
      status = 'PLAYING',
      p1_score = 0,
      p2_score = 0,
      p1_rematch_ready = FALSE,
      p2_rematch_ready = FALSE,
      last_scorer_id = NULL,
      last_correct_answer = NULL
    WHERE id = p_room_id;

    -- 첫 번째 퀴즈 출제
    PERFORM generate_next_quiz(p_room_id);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- [RPC 5] 싱글모드 전용 호선 필터 지원 무작위 퀴즈 추출 함수
CREATE OR REPLACE FUNCTION get_single_quiz(
  p_selected_line_ids INT[] DEFAULT NULL
)
RETURNS TABLE (
  target_station_id INT,
  target_station_name VARCHAR,
  line_name VARCHAR,
  color_code VARCHAR,
  left_2 VARCHAR,
  left_1 VARCHAR,
  right_1 VARCHAR,
  right_2 VARCHAR
) AS $$
DECLARE
  v_target_id INT;
  v_line_id INT;
  v_target_name VARCHAR;
  v_line_name VARCHAR;
  v_color_code VARCHAR;
  
  v_l1 INT;
  v_l2 INT;
  v_r1 INT;
  v_r2 INT;
  
  v_l2_name VARCHAR;
  v_l1_name VARCHAR;
  v_r1_name VARCHAR;
  v_r2_name VARCHAR;
BEGIN
  -- 선택된 호선 ID 배열 필터링 적용 (파라미터가 없거나 빈 경우 전체 호선)
  IF p_selected_line_ids IS NULL OR cardinality(p_selected_line_ids) = 0 THEN
    SELECT from_station_id, line_id INTO v_target_id, v_line_id
    FROM station_connections
    ORDER BY random()
    LIMIT 1;
  ELSE
    SELECT from_station_id, line_id INTO v_target_id, v_line_id
    FROM station_connections
    WHERE line_id = ANY(p_selected_line_ids)
    ORDER BY random()
    LIMIT 1;
  END IF;

  -- 엣지 데이터가 없어 퀴즈를 생성할 수 없는 경우 안전 종료 (C1 방어)
  IF v_target_id IS NULL THEN
    RETURN;
  END IF;

  SELECT station_name INTO v_target_name FROM stations WHERE id = v_target_id;
  SELECT lines.line_name, lines.color_code INTO v_line_name, v_color_code FROM lines WHERE id = v_line_id;

  SELECT to_station_id INTO v_l1 
  FROM station_connections 
  WHERE from_station_id = v_target_id AND line_id = v_line_id
  ORDER BY to_station_id LIMIT 1;

  IF v_l1 IS NOT NULL THEN
    SELECT to_station_id INTO v_l2 
    FROM station_connections 
    WHERE from_station_id = v_l1 AND line_id = v_line_id AND to_station_id != v_target_id
    LIMIT 1;
  END IF;

  SELECT to_station_id INTO v_r1 
  FROM station_connections 
  WHERE from_station_id = v_target_id AND line_id = v_line_id
  ORDER BY to_station_id DESC LIMIT 1;

  IF v_r1 IS NOT NULL AND v_r1 != v_l1 THEN
    SELECT to_station_id INTO v_r2 
    FROM station_connections 
    WHERE from_station_id = v_r1 AND line_id = v_line_id AND to_station_id != v_target_id
    LIMIT 1;
  ELSE
    v_r1 := NULL;
    v_r2 := NULL;
  END IF;

  SELECT station_name INTO v_l2_name FROM stations WHERE id = v_l2;
  SELECT station_name INTO v_l1_name FROM stations WHERE id = v_l1;
  SELECT station_name INTO v_r1_name FROM stations WHERE id = v_r1;
  SELECT station_name INTO v_r2_name FROM stations WHERE id = v_r2;

  RETURN QUERY SELECT 
    v_target_id, v_target_name, v_line_name, v_color_code, 
    v_l2_name, v_l1_name, v_r1_name, v_r2_name;
END;
$$ LANGUAGE plpgsql;

-- 5. 싱글모드 전역 랭킹 테이블 (호선 정보 포함)
CREATE TABLE rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  score INT NOT NULL,
  line_ids INT[],               -- 플레이한 호선 목록
  line_summary VARCHAR(100),    -- 호선 요약 텍스트 (예: '2호선', '전체(1~9호선)')
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- [RPC 6] 호선별/전체 명예의 전당 랭킹 조회 함수
CREATE OR REPLACE FUNCTION get_rankings_by_line(
  p_line_id INT DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  player_id UUID,
  nickname VARCHAR,
  score INT,
  line_summary VARCHAR,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  IF p_line_id IS NULL THEN
    -- 전체 랭킹 조회
    RETURN QUERY
    SELECT r.id, r.player_id, r.nickname, r.score, r.line_summary, r.created_at
    FROM rankings r
    ORDER BY r.score DESC, r.created_at ASC
    LIMIT 20;
  ELSE
    -- 특정 호선(p_line_id)이 포함된 랭킹만 조회
    RETURN QUERY
    SELECT r.id, r.player_id, r.nickname, r.score, r.line_summary, r.created_at
    FROM rankings r
    WHERE p_line_id = ANY(r.line_ids) OR r.line_ids IS NULL
    ORDER BY r.score DESC, r.created_at ASC
    LIMIT 20;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- [RPC 7] 방 퇴장 및 방장 승계(Host Migration) / 세션 영구 유지 함수
CREATE OR REPLACE FUNCTION exit_room(
  p_room_id UUID,
  p_player_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_p1 UUID;
  v_p2 UUID;
  v_status VARCHAR;
BEGIN
  SELECT player_1, player_2, status INTO v_p1, v_p2, v_status
  FROM game_rooms
  WHERE id = p_room_id FOR UPDATE;

  -- 0) 진행 중인 대전(PLAYING) 또는 종료된 대전(FINISHED)인 경우, 한 명이라도 이탈(기권)하면 방 전체를 CANCELLED로 파기
  IF v_status = 'PLAYING' OR v_status = 'FINISHED' THEN
    UPDATE game_rooms
    SET 
      status = 'CANCELLED',
      player_1 = NULL,
      player_2 = NULL,
      p1_ready = FALSE,
      p2_ready = FALSE,
      p1_rematch_ready = FALSE,
      p2_rematch_ready = FALSE
    WHERE id = p_room_id;
    RETURN TRUE;
  END IF;

  -- 1) 대기 중(WAITING)일 때 방장(Player 1)이 퇴장한 경우
  IF p_player_id = v_p1 THEN
    IF v_p2 IS NOT NULL THEN
      -- 대기 중인 Player 2를 새로운 방장(Player 1)으로 승격 (Host Migration)
      UPDATE game_rooms
      SET 
        player_1 = v_p2,
        player_2 = NULL,
        p1_ready = TRUE,
        p2_ready = FALSE
      WHERE id = p_room_id;
    ELSE
      -- 플레이어가 아무도 남지 않은 경우 비로소 방 파기
      UPDATE game_rooms
      SET 
        status = 'CANCELLED',
        player_1 = NULL,
        p1_ready = FALSE,
        p2_ready = FALSE
      WHERE id = p_room_id;
    END IF;
    RETURN TRUE;
  -- 2) 대기 중(WAITING)일 때 참가자(Player 2)가 퇴장한 경우: player_2 = NULL 및 p2_ready = FALSE 원복 (방 세션 유지)
  ELSIF p_player_id = v_p2 THEN
    UPDATE game_rooms
    SET 
      player_2 = NULL,
      p2_ready = FALSE
    WHERE id = p_room_id;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- 6. Row Level Security (RLS) 설정 및 공용 접근 허용 정책
-- =======================================================

-- RLS 보안 활성화 (rankings 무단 삭제/갱신 방지)
ALTER TABLE stations DISABLE ROW LEVEL SECURITY;
ALTER TABLE lines DISABLE ROW LEVEL SECURITY;
ALTER TABLE station_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;

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

-- 5) rankings: 모든 익명 사용자 읽기, 삽입 허용 정책
CREATE POLICY "Allow public read on rankings" ON rankings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public insert on rankings" ON rankings
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 6) game_rooms 테이블에 대한 실시간 변경 감지(Realtime) 게시 설정 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;