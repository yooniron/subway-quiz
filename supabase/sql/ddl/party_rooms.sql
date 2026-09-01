-- ==========================================
-- DDL: 8인 파티룸 대전방 마스터 테이블 (멱등성 보장)
-- ==========================================
CREATE TABLE IF NOT EXISTS party_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_title VARCHAR(100) DEFAULT '🎉 지하철 8인 스피드 다인전 서바이벌',
  invite_code VARCHAR(10) UNIQUE NOT NULL,
  host_id UUID NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  room_password VARCHAR(50),
  selected_line_ids INT[],
  max_players INT DEFAULT 8,
  current_round INT DEFAULT 1,
  total_rounds INT DEFAULT 10,
  status VARCHAR(20) DEFAULT 'WAITING', -- 'WAITING', 'PLAYING', 'FINISHED'
  players JSONB DEFAULT '[]'::jsonb,     -- 8인 참가자 상태 배열 (id, nickname, score, isHost, isReady, hasAnswered, combo)
  current_quiz JSONB,                   -- 현재 라운드 퀴즈 객체
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 초대코드 고유 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_party_rooms_invite_code ON party_rooms (invite_code);

-- ==========================================
-- DDL: 정답자 전용 시크릿 채팅 테이블 (멱등성 보장)
-- ==========================================
CREATE TABLE IF NOT EXISTS party_room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES party_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_nickname VARCHAR(50) NOT NULL,
  message_text TEXT NOT NULL,
  is_secret BOOLEAN DEFAULT TRUE,      -- 정답자 전용 시크릿 채널 메시지 여부
  message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'preset', 'emoji'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 방 ID 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_party_room_messages_room_id ON party_room_messages (room_id);
