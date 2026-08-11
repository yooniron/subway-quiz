-- ==========================================
-- DDL: 사용자 계정 및 클라우드 프로필 테이블 (멱등성 보장)
-- 개인식별정보 0개 (Zero-PII): 이메일/실명/전화번호 일절 미수집
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,       -- 로그인용 영문/숫자 아이디
  password_hash VARCHAR(128) NOT NULL,        -- SHA-256 단방향 암호화 해시
  nickname VARCHAR(50) NOT NULL,              -- 표시용 닉네임
  equipped_title VARCHAR(50),                 -- 현재 장착 칭호
  unlocked_achievement_ids TEXT[] DEFAULT '{}', -- 해금된 업적 ID 목록
  unlocked_dates JSONB DEFAULT '{}'::jsonb,    -- 업적 달성 일시 맵
  stats JSONB DEFAULT '{
    "totalCorrect": 0,
    "maxCombo": 0,
    "singleHighScore": 0,
    "fastAnswerCount": 0,
    "superFastAnswerCount": 0,
    "singleGamesPlayed": 0,
    "practiceCorrectCount": 0,
    "multiplayerWins": 0,
    "multiplayerWinStreak": 0,
    "maxMultiplayerWinStreak": 0,
    "hintsUsedCount": 0,
    "allClearAchieved": false,
    "lineCorrectCounts": {}
  }'::jsonb,                                   -- 게임 통계 및 전적
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
