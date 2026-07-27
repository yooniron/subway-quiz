-- ==========================================
-- 매치메이킹 및 방 생성/조회 Stored Procedures (100% 멱등성 보장)
-- ==========================================

-- [RPC 1] 일반 대전방 매치메이킹 (동일 호선 조합 필터 매칭)
DROP FUNCTION IF EXISTS join_or_create_room(UUID, INT[]);
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
  SELECT id INTO v_room_id
  FROM game_rooms
  WHERE status = 'WAITING' 
    AND player_1 != p_player_id
    AND is_private IS FALSE
    AND (
      (p_selected_line_ids IS NULL AND selected_line_ids IS NULL) OR
      (selected_line_ids = p_selected_line_ids)
    )
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE;

  IF v_room_id IS NOT NULL THEN
    UPDATE game_rooms
    SET 
      player_2 = p_player_id,
      status = 'WAITING',
      p1_last_seen = NOW(),
      p2_last_seen = NOW()
    WHERE id = v_room_id;
    
    RETURN QUERY SELECT v_room_id, 'player_2'::VARCHAR;
  ELSE
    INSERT INTO game_rooms (player_1, status, selected_line_ids, p1_last_seen)
    VALUES (p_player_id, 'WAITING', p_selected_line_ids, NOW())
    RETURNING id INTO v_room_id;
    
    RETURN QUERY SELECT v_room_id, 'player_1'::VARCHAR;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- [RPC 2] 커스텀 맞춤 방 생성 (방 제목, 호선 선택, 비공개/비밀번호, 목표 점수 지원)
DROP FUNCTION IF EXISTS create_custom_room(UUID, VARCHAR, INT[], BOOLEAN, VARCHAR, INT);
CREATE OR REPLACE FUNCTION create_custom_room(
  p_player_id UUID,
  p_room_title VARCHAR(100) DEFAULT '즐거운 지하철 스피드 대전 방',
  p_selected_line_ids INT[] DEFAULT NULL,
  p_is_private BOOLEAN DEFAULT FALSE,
  p_password VARCHAR(50) DEFAULT NULL,
  p_target_score INT DEFAULT 500
) RETURNS TABLE (
  room_id UUID,
  player_role VARCHAR,
  invite_code VARCHAR
) AS $$
DECLARE
  v_room_id UUID;
  v_invite_code VARCHAR;
BEGIN
  v_invite_code := upper(substring(md5(random()::text) from 1 for 6));

  INSERT INTO game_rooms (
    player_1, status, room_title, selected_line_ids, 
    is_private, room_password, invite_code, target_score, p1_last_seen
  ) VALUES (
    p_player_id, 'WAITING', p_room_title, p_selected_line_ids, 
    p_is_private, p_password, v_invite_code, p_target_score, NOW()
  ) RETURNING id INTO v_room_id;

  RETURN QUERY SELECT v_room_id, 'player_1'::VARCHAR, v_invite_code;
END;
$$ LANGUAGE plpgsql;

-- [RPC 3] 비밀번호/초대코드 비공개 방 입장
DROP FUNCTION IF EXISTS join_private_room(UUID, VARCHAR, VARCHAR, UUID);
CREATE OR REPLACE FUNCTION join_private_room(
  p_player_id UUID,
  p_invite_code VARCHAR DEFAULT NULL,
  p_password VARCHAR DEFAULT NULL,
  p_room_id UUID DEFAULT NULL
) RETURNS TABLE (
  room_id UUID,
  player_role VARCHAR,
  success BOOLEAN,
  message VARCHAR
) AS $$
DECLARE
  v_target_room RECORD;
BEGIN
  IF p_invite_code IS NOT NULL THEN
    SELECT * INTO v_target_room FROM game_rooms 
    WHERE invite_code = upper(trim(p_invite_code)) AND status = 'WAITING';
  ELSIF p_room_id IS NOT NULL THEN
    SELECT * INTO v_target_room FROM game_rooms 
    WHERE id = p_room_id AND status = 'WAITING';
  ELSE
    RETURN QUERY SELECT NULL::UUID, NULL::VARCHAR, FALSE, '입장할 방 정보가 제공되지 않았습니다.'::VARCHAR;
    RETURN;
  END IF;

  IF v_target_room.id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, NULL::VARCHAR, FALSE, '존재하지 않거나 대기 중이 아닌 방입니다.'::VARCHAR;
    RETURN;
  END IF;

  IF v_target_room.player_1 = p_player_id THEN
    RETURN QUERY SELECT v_target_room.id, 'player_1'::VARCHAR, TRUE, '기존 방장으로 다시 입장합니다.'::VARCHAR;
    RETURN;
  END IF;

  IF v_target_room.is_private AND v_target_room.room_password IS NOT NULL THEN
    IF p_password IS NULL OR v_target_room.room_password != p_password THEN
      RETURN QUERY SELECT NULL::UUID, NULL::VARCHAR, FALSE, '방 비밀번호가 일치하지 않습니다.'::VARCHAR;
      RETURN;
    END IF;
  END IF;

  UPDATE game_rooms
  SET player_2 = p_player_id, status = 'WAITING', p2_last_seen = NOW()
  WHERE id = v_target_room.id;

  RETURN QUERY SELECT v_target_room.id, 'player_2'::VARCHAR, TRUE, '비공개 방 입장에 성공하였습니다!'::VARCHAR;
END;
$$ LANGUAGE plpgsql;

-- [RPC 4] 활성화된 로비 방 목록 조회 (42P13 리턴 타입 변경 에러 방지 DROP 처리)
DROP FUNCTION IF EXISTS get_active_lobbies();
CREATE OR REPLACE FUNCTION get_active_lobbies()
RETURNS TABLE (
  room_id UUID,
  room_title VARCHAR,
  host_id UUID,
  selected_line_ids INT[],
  is_private BOOLEAN,
  target_score INT,
  player_count INT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id AS room_id,
    g.room_title,
    g.player_1 AS host_id,
    g.selected_line_ids,
    g.is_private,
    g.target_score,
    (CASE WHEN g.player_2 IS NOT NULL THEN 2 ELSE 1 END)::INT AS player_count,
    g.created_at
  FROM game_rooms g
  WHERE g.status = 'WAITING'
  ORDER BY g.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- [RPC 5] 방 정보 단건 상세 조회
DROP FUNCTION IF EXISTS get_room_details(UUID);
CREATE OR REPLACE FUNCTION get_room_details(p_room_id UUID)
RETURNS TABLE (
  room_id UUID,
  room_title VARCHAR,
  selected_line_ids INT[],
  is_private BOOLEAN,
  invite_code VARCHAR,
  target_score INT,
  status VARCHAR,
  player_1 UUID,
  player_2 UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id, g.room_title, g.selected_line_ids, g.is_private, 
    g.invite_code, g.target_score, g.status, g.player_1, g.player_2
  FROM game_rooms g
  WHERE g.id = p_room_id;
END;
$$ LANGUAGE plpgsql;
