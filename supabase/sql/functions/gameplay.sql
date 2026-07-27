-- ==========================================
-- 실시간 대전 게임플레이 및 인터랙션 Stored Procedures (100% 멱등성 보장)
-- ==========================================

-- [RPC 1] 원자적 정답 검증 및 스코어 반영/다음 퀴즈 출제 함수
DROP FUNCTION IF EXISTS submit_answer(UUID, UUID, VARCHAR, INT);
CREATE OR REPLACE FUNCTION submit_answer(
  p_room_id UUID,
  p_player_id UUID,
  p_user_input VARCHAR,
  p_points INT DEFAULT 100
) RETURNS JSONB AS $$
DECLARE
  v_room RECORD;
  v_clean_user VARCHAR;
  v_clean_target VARCHAR;
  v_is_correct BOOLEAN := FALSE;
  v_new_score INT;
  v_is_p1 BOOLEAN;
  v_target_score INT;
BEGIN
  SELECT * INTO v_room FROM game_rooms WHERE id = p_room_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN JSONB_BUILD_OBJECT('success', FALSE, 'message', '존재하지 않는 방입니다.');
  END IF;

  IF v_room.status != 'PLAYING' AND v_room.status != 'WAITING' THEN
    RETURN JSONB_BUILD_OBJECT('success', FALSE, 'message', '진행 중인 게임이 아닙니다.');
  END IF;

  v_clean_user := regexp_replace(trim(p_user_input), '역$', '');
  v_clean_target := regexp_replace(trim(v_room.quiz_target_name), '역$', '');
  
  IF v_clean_user = v_clean_target THEN
    v_is_correct := TRUE;
  END IF;

  v_target_score := COALESCE(v_room.target_score, 500);

  IF v_is_correct THEN
    v_is_p1 := (v_room.player_1 = p_player_id);
    
    IF v_is_p1 THEN
      v_new_score := v_room.p1_score + p_points;
      UPDATE game_rooms 
      SET 
        p1_score = v_new_score,
        current_turn = v_room.player_2,
        status = CASE WHEN v_new_score >= v_target_score THEN 'FINISHED' ELSE 'PLAYING' END,
        p1_last_seen = NOW()
      WHERE id = p_room_id;
    ELSE
      v_new_score := v_room.p2_score + p_points;
      UPDATE game_rooms 
      SET 
        p2_score = v_new_score,
        current_turn = v_room.player_1,
        status = CASE WHEN v_new_score >= v_target_score THEN 'FINISHED' ELSE 'PLAYING' END,
        p2_last_seen = NOW()
      WHERE id = p_room_id;
    END IF;

    IF v_new_score < v_target_score THEN
      PERFORM generate_next_quiz(p_room_id);
    END IF;

    RETURN JSONB_BUILD_OBJECT(
      'success', TRUE, 
      'is_correct', TRUE, 
      'score', v_new_score,
      'game_over', (v_new_score >= v_target_score)
    );
  ELSE
    IF v_room.player_1 = p_player_id THEN
      UPDATE game_rooms SET p1_last_seen = NOW() WHERE id = p_room_id;
    ELSE
      UPDATE game_rooms SET p2_last_seen = NOW() WHERE id = p_room_id;
    END IF;

    RETURN JSONB_BUILD_OBJECT('success', TRUE, 'is_correct', FALSE);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- [RPC 2] 양측 동의 스피드 패스 함수
DROP FUNCTION IF EXISTS request_pass(UUID, UUID);
CREATE OR REPLACE FUNCTION request_pass(
  p_room_id UUID,
  p_player_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_room RECORD;
  v_both_passed BOOLEAN := FALSE;
BEGIN
  SELECT * INTO v_room FROM game_rooms WHERE id = p_room_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN JSONB_BUILD_OBJECT('success', FALSE, 'message', '방을 찾을 수 없습니다.');
  END IF;

  IF v_room.player_1 = p_player_id THEN
    UPDATE game_rooms SET p1_pass_requested = TRUE, p1_last_seen = NOW() WHERE id = p_room_id;
    IF v_room.p2_pass_requested IS TRUE THEN
      v_both_passed := TRUE;
    END IF;
  ELSIF v_room.player_2 = p_player_id THEN
    UPDATE game_rooms SET p2_pass_requested = TRUE, p2_last_seen = NOW() WHERE id = p_room_id;
    IF v_room.p1_pass_requested IS TRUE THEN
      v_both_passed := TRUE;
    END IF;
  ELSE
    RETURN JSONB_BUILD_OBJECT('success', FALSE, 'message', '방 참가자가 아닙니다.');
  END IF;

  IF v_both_passed THEN
    PERFORM generate_next_quiz(p_room_id);
    RETURN JSONB_BUILD_OBJECT('success', TRUE, 'passed', TRUE, 'message', '양측 동의로 문제 패스!');
  ELSE
    RETURN JSONB_BUILD_OBJECT('success', TRUE, 'passed', FALSE, 'message', '상대방의 패스 동의 대기 중...');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- [RPC 3] 1대1 대전 종료 후 재경기 신청 함수
DROP FUNCTION IF EXISTS request_rematch(UUID, UUID);
CREATE OR REPLACE FUNCTION request_rematch(
  p_room_id UUID,
  p_player_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_room RECORD;
  v_both_ready BOOLEAN := FALSE;
BEGIN
  SELECT * INTO v_room FROM game_rooms WHERE id = p_room_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN JSONB_BUILD_OBJECT('success', FALSE, 'message', '방을 찾을 수 없습니다.');
  END IF;

  IF v_room.player_1 = p_player_id THEN
    UPDATE game_rooms SET p1_rematch_ready = TRUE, p1_last_seen = NOW() WHERE id = p_room_id;
    IF v_room.p2_rematch_ready IS TRUE THEN
      v_both_ready := TRUE;
    END IF;
  ELSIF v_room.player_2 = p_player_id THEN
    UPDATE game_rooms SET p2_rematch_ready = TRUE, p2_last_seen = NOW() WHERE id = p_room_id;
    IF v_room.p1_rematch_ready IS TRUE THEN
      v_both_ready := TRUE;
    END IF;
  ELSE
    RETURN JSONB_BUILD_OBJECT('success', FALSE, 'message', '방 참가자가 아닙니다.');
  END IF;

  IF v_both_ready THEN
    UPDATE game_rooms 
    SET 
      p1_score = 0,
      p2_score = 0,
      p2_ready = TRUE,
      status = 'PLAYING',
      p1_rematch_ready = FALSE,
      p2_rematch_ready = FALSE
    WHERE id = p_room_id;

    PERFORM generate_next_quiz(p_room_id);
    RETURN JSONB_BUILD_OBJECT('success', TRUE, 'rematch_started', TRUE, 'message', '재경기가 시작되었습니다!');
  ELSE
    RETURN JSONB_BUILD_OBJECT('success', TRUE, 'rematch_started', FALSE, 'message', '상대방의 재경기 수락 대기 중...');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- [RPC 4] 대기실 방 설정 실시간 라이브 동기화 변경 함수
DROP FUNCTION IF EXISTS update_room_settings(UUID, UUID, VARCHAR, BOOLEAN, VARCHAR, INT[], INT);
CREATE OR REPLACE FUNCTION update_room_settings(
  p_room_id UUID,
  p_host_id UUID,
  p_title VARCHAR(100),
  p_is_private BOOLEAN,
  p_password VARCHAR(50),
  p_selected_line_ids INT[],
  p_target_score INT
) RETURNS JSONB AS $$
DECLARE
  v_room RECORD;
BEGIN
  SELECT * INTO v_room FROM game_rooms WHERE id = p_room_id;
  IF NOT FOUND THEN
    RETURN JSONB_BUILD_OBJECT('success', FALSE, 'message', '방을 찾을 수 없습니다.');
  END IF;

  IF v_room.player_1 != p_host_id THEN
    RETURN JSONB_BUILD_OBJECT('success', FALSE, 'message', '방장만 방 설정을 변경할 수 있습니다.');
  END IF;

  UPDATE game_rooms
  SET 
    room_title = COALESCE(p_title, room_title),
    is_private = COALESCE(p_is_private, is_private),
    room_password = CASE WHEN p_is_private IS FALSE THEN NULL ELSE COALESCE(p_password, room_password) END,
    selected_line_ids = COALESCE(p_selected_line_ids, selected_line_ids),
    target_score = COALESCE(p_target_score, target_score)
  WHERE id = p_room_id;

  RETURN JSONB_BUILD_OBJECT('success', TRUE, 'message', '방 설정이 성공적으로 변경되었습니다.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
