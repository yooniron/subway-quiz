-- ==========================================
-- PL/pgSQL RPC: 6자리 초대 코드로 8인 파티룸 조회/입장
-- ==========================================
CREATE OR REPLACE FUNCTION join_party_room_by_code(
  p_invite_code VARCHAR,
  p_player JSONB
)
RETURNS TABLE (
  room_id UUID,
  room_title VARCHAR,
  players JSONB,
  status VARCHAR,
  error_message VARCHAR
) AS $$
DECLARE
  v_room party_rooms%ROWTYPE;
  v_players JSONB;
BEGIN
  -- 1. 초대 코드로 방 조회 및 FOR UPDATE 락
  SELECT * INTO v_room
  FROM party_rooms
  WHERE invite_code = p_invite_code
  FOR UPDATE;

  IF v_room.id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, NULL::VARCHAR, NULL::JSONB, NULL::VARCHAR, '존재하지 않는 파티룸 초대 코드입니다.'::VARCHAR;
    RETURN;
  END IF;

  IF v_room.status != 'WAITING' THEN
    RETURN QUERY SELECT NULL::UUID, NULL::VARCHAR, NULL::JSONB, NULL::VARCHAR, '이미 게임이 시작되었거나 종료된 방입니다.'::VARCHAR;
    RETURN;
  END IF;

  IF jsonb_array_length(v_room.players) >= v_room.max_players THEN
    RETURN QUERY SELECT NULL::UUID, NULL::VARCHAR, NULL::JSONB, NULL::VARCHAR, '방 정원(8명)이 가득 차 입장할 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- 2. 신규 플레이어 추가
  v_players := v_room.players || jsonb_build_array(p_player);

  UPDATE party_rooms
  SET players = v_players, updated_at = NOW()
  WHERE id = v_room.id;

  RETURN QUERY SELECT v_room.id, v_room.room_title, v_players, v_room.status, NULL::VARCHAR;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- PL/pgSQL RPC: 정답자 전용 시크릿 채팅 메시지 작성
-- ==========================================
CREATE OR REPLACE FUNCTION post_party_room_message(
  p_room_id UUID,
  p_sender_id UUID,
  p_sender_nickname VARCHAR,
  p_message_text TEXT,
  p_is_secret BOOLEAN DEFAULT TRUE,
  p_message_type VARCHAR DEFAULT 'text'
)
RETURNS UUID AS $$
DECLARE
  v_msg_id UUID;
BEGIN
  INSERT INTO party_room_messages (
    room_id,
    sender_id,
    sender_nickname,
    message_text,
    is_secret,
    message_type
  ) VALUES (
    p_room_id,
    p_sender_id,
    p_sender_nickname,
    p_message_text,
    p_is_secret,
    p_message_type
  )
  RETURNING id INTO v_msg_id;

  RETURN v_msg_id;
END;
$$ LANGUAGE plpgsql;
