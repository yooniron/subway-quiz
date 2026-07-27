-- ==========================================
-- 퀴즈 무작위 생성 및 중복 출제 방지 Stored Procedures (100% 멱등성 보장)
-- ==========================================

-- [RPC 1] 멀티플레이 실시간 퀴즈 생성 및 방 정보 업데이트 함수 (호선 필터 & 중복 방지 반영)
DROP FUNCTION IF EXISTS generate_next_quiz(UUID, INT[]);
CREATE OR REPLACE FUNCTION generate_next_quiz(
  p_room_id UUID,
  p_exclude_station_ids INT[] DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_selected_lines INT[];
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
  SELECT selected_line_ids INTO v_selected_lines FROM game_rooms WHERE id = p_room_id;

  IF v_selected_lines IS NULL OR cardinality(v_selected_lines) = 0 THEN
    SELECT from_station_id, line_id INTO v_target_id, v_line_id
    FROM station_connections
    WHERE (p_exclude_station_ids IS NULL OR from_station_id != ALL(p_exclude_station_ids))
    ORDER BY random()
    LIMIT 1;
  ELSE
    SELECT from_station_id, line_id INTO v_target_id, v_line_id
    FROM station_connections
    WHERE line_id = ANY(v_selected_lines)
      AND (p_exclude_station_ids IS NULL OR from_station_id != ALL(p_exclude_station_ids))
    ORDER BY random()
    LIMIT 1;
  END IF;

  -- 제외 조건 후 남은 역이 없으면 중복 리셋 후 재시도
  IF v_target_id IS NULL AND p_exclude_station_ids IS NOT NULL THEN
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
  END IF;

  SELECT station_name INTO v_target_name FROM stations WHERE id = v_target_id;
  SELECT line_name, color_code INTO v_line_name, v_color_code FROM lines WHERE id = v_line_id;

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
    quiz_created_at = NOW(),
    p1_pass_requested = FALSE,
    p2_pass_requested = FALSE
  WHERE id = p_room_id;
END;
$$ LANGUAGE plpgsql;

-- [RPC 2] 싱글모드 전용 호선 필터 및 중복 출제 방지 지원 무작위 퀴즈 추출 함수
DROP FUNCTION IF EXISTS get_single_quiz(INT[], INT[]);
CREATE OR REPLACE FUNCTION get_single_quiz(
  p_selected_line_ids INT[] DEFAULT NULL,
  p_exclude_station_ids INT[] DEFAULT NULL
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
  IF p_selected_line_ids IS NULL OR cardinality(p_selected_line_ids) = 0 THEN
    SELECT from_station_id, line_id INTO v_target_id, v_line_id
    FROM station_connections
    WHERE (p_exclude_station_ids IS NULL OR from_station_id != ALL(p_exclude_station_ids))
    ORDER BY random()
    LIMIT 1;
  ELSE
    SELECT from_station_id, line_id INTO v_target_id, v_line_id
    FROM station_connections
    WHERE line_id = ANY(p_selected_line_ids)
      AND (p_exclude_station_ids IS NULL OR from_station_id != ALL(p_exclude_station_ids))
    ORDER BY random()
    LIMIT 1;
  END IF;

  -- 엣지 데이터가 없어 퀴즈를 생성할 수 없는 경우 안전 종료
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
