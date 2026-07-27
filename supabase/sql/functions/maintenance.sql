-- ==========================================
-- 시스템 세션 관리 및 유령방 청소 Stored Procedures (100% 멱등성 보장)
-- ==========================================

-- [RPC 1] 30초 이상 무응답 유령방 자동 청소
DROP FUNCTION IF EXISTS cleanup_ghost_rooms();
CREATE OR REPLACE FUNCTION cleanup_ghost_rooms()
RETURNS INT AS $$
DECLARE
  v_cleaned_count INT := 0;
BEGIN
  DELETE FROM game_rooms
  WHERE status = 'WAITING'
    AND player_2 IS NULL
    AND p1_last_seen < NOW() - INTERVAL '30 seconds';
    
  GET DIAGNOSTICS v_cleaned_count = ROW_COUNT;
  RETURN v_cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- [RPC 2] 방장 핑 갱신 및 이탈 여부 감지 함수
DROP FUNCTION IF EXISTS check_host_presence(UUID, UUID);
CREATE OR REPLACE FUNCTION check_host_presence(
  p_room_id UUID,
  p_player_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_room RECORD;
  v_is_host_active BOOLEAN := TRUE;
BEGIN
  SELECT * INTO v_room FROM game_rooms WHERE id = p_room_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN JSONB_BUILD_OBJECT('host_active', FALSE, 'room_exists', FALSE);
  END IF;

  IF v_room.player_1 = p_player_id THEN
    UPDATE game_rooms SET p1_last_seen = NOW() WHERE id = p_room_id;
  ELSIF v_room.player_2 = p_player_id THEN
    UPDATE game_rooms SET p2_last_seen = NOW() WHERE id = p_room_id;
  END IF;

  IF v_room.p1_last_seen < NOW() - INTERVAL '25 seconds' THEN
    v_is_host_active := FALSE;
  END IF;

  RETURN JSONB_BUILD_OBJECT(
    'host_active', v_is_host_active,
    'room_exists', TRUE,
    'status', v_room.status
  );
END;
$$ LANGUAGE plpgsql;
