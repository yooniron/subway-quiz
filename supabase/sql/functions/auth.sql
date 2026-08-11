-- ==========================================
-- 1. RPC: 사용자 익명 계정 회원가입 (게스트 데이터 마이그레이션 지원)
-- ==========================================
CREATE OR REPLACE FUNCTION register_user(
  p_username VARCHAR,
  p_password_hash VARCHAR,
  p_nickname VARCHAR,
  p_initial_equipped_title VARCHAR DEFAULT NULL,
  p_initial_unlocked_ids TEXT[] DEFAULT '{}',
  p_initial_unlocked_dates JSONB DEFAULT '{}'::jsonb,
  p_initial_stats JSONB DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  username VARCHAR,
  nickname VARCHAR,
  equipped_title VARCHAR,
  unlocked_achievement_ids TEXT[],
  unlocked_dates JSONB,
  stats JSONB,
  error_message VARCHAR
) AS $$
DECLARE
  v_new_id UUID;
  v_stats JSONB;
  v_default_stats JSONB := '{
    "totalCorrect": 0, "maxCombo": 0, "singleHighScore": 0,
    "fastAnswerCount": 0, "superFastAnswerCount": 0, "singleGamesPlayed": 0,
    "practiceCorrectCount": 0, "multiplayerWins": 0, "multiplayerWinStreak": 0,
    "maxMultiplayerWinStreak": 0, "hintsUsedCount": 0, "allClearAchieved": false,
    "lineCorrectCounts": {}
  }'::jsonb;
BEGIN
  -- 아이디 중복 체크
  IF EXISTS (SELECT 1 FROM users WHERE users.username = lower(trim(p_username))) THEN
    RETURN QUERY SELECT 
      NULL::UUID, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR, 
      NULL::TEXT[], NULL::JSONB, NULL::JSONB, '이미 존재하는 아이디입니다.'::VARCHAR;
    RETURN;
  END IF;

  -- 통계 데이터 병합
  IF p_initial_stats IS NOT NULL THEN
    v_stats := v_default_stats || p_initial_stats;
  ELSE
    v_stats := v_default_stats;
  END IF;

  -- 신규 유저 생성
  INSERT INTO users (
    username,
    password_hash,
    nickname,
    equipped_title,
    unlocked_achievement_ids,
    unlocked_dates,
    stats
  ) VALUES (
    lower(trim(p_username)),
    p_password_hash,
    trim(p_nickname),
    p_initial_equipped_title,
    COALESCE(p_initial_unlocked_ids, '{}'),
    COALESCE(p_initial_unlocked_dates, '{}'::jsonb),
    v_stats
  )
  RETURNING users.id INTO v_new_id;

  RETURN QUERY SELECT 
    u.id,
    u.username,
    u.nickname,
    u.equipped_title,
    u.unlocked_achievement_ids,
    u.unlocked_dates,
    u.stats,
    NULL::VARCHAR
  FROM users u
  WHERE u.id = v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 2. RPC: 사용자 로그인
-- ==========================================
CREATE OR REPLACE FUNCTION login_user(
  p_username VARCHAR,
  p_password_hash VARCHAR
)
RETURNS TABLE (
  id UUID,
  username VARCHAR,
  nickname VARCHAR,
  equipped_title VARCHAR,
  unlocked_achievement_ids TEXT[],
  unlocked_dates JSONB,
  stats JSONB,
  error_message VARCHAR
) AS $$
DECLARE
  v_user users%ROWTYPE;
BEGIN
  SELECT * INTO v_user
  FROM users
  WHERE users.username = lower(trim(p_username));

  IF v_user.id IS NULL THEN
    RETURN QUERY SELECT 
      NULL::UUID, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR, 
      NULL::TEXT[], NULL::JSONB, NULL::JSONB, '존재하지 않는 아이디입니다.'::VARCHAR;
    RETURN;
  END IF;

  IF v_user.password_hash != p_password_hash THEN
    RETURN QUERY SELECT 
      NULL::UUID, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR, 
      NULL::TEXT[], NULL::JSONB, NULL::JSONB, '비밀번호가 일치하지 않습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- 로그인 성공
  RETURN QUERY SELECT 
    v_user.id,
    v_user.username,
    v_user.nickname,
    v_user.equipped_title,
    v_user.unlocked_achievement_ids,
    v_user.unlocked_dates,
    v_user.stats,
    NULL::VARCHAR;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 3. RPC: 클라우드 프로필 실시간 동기화
-- ==========================================
CREATE OR REPLACE FUNCTION sync_user_profile(
  p_user_id UUID,
  p_nickname VARCHAR DEFAULT NULL,
  p_equipped_title VARCHAR DEFAULT NULL,
  p_unlocked_ids TEXT[] DEFAULT NULL,
  p_unlocked_dates JSONB DEFAULT NULL,
  p_stats JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE users
  SET
    nickname = COALESCE(NULLIF(trim(p_nickname), ''), nickname),
    equipped_title = p_equipped_title,
    unlocked_achievement_ids = COALESCE(p_unlocked_ids, unlocked_achievement_ids),
    unlocked_dates = COALESCE(p_unlocked_dates, unlocked_dates),
    stats = COALESCE(p_stats, stats),
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
