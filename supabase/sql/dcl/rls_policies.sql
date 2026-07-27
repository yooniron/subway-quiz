-- ==========================================
-- Row Level Security (RLS) 및 접근 정책 설정 (100% 멱등성 보장)
-- ==========================================

-- 1) RLS 활성화 (이미 활성화된 경우에도 안전)
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE station_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;

-- 2) Policy 초기화 후 재생성 (DROP POLICY IF EXISTS로 멱등성 보장)
DROP POLICY IF EXISTS "Allow public read on stations" ON stations;
CREATE POLICY "Allow public read on stations" ON stations FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public read on lines" ON lines;
CREATE POLICY "Allow public read on lines" ON lines FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public read on station_connections" ON station_connections;
CREATE POLICY "Allow public read on station_connections" ON station_connections FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public read on game_rooms" ON game_rooms;
CREATE POLICY "Allow public read on game_rooms" ON game_rooms FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert on game_rooms" ON game_rooms;
CREATE POLICY "Allow public insert on game_rooms" ON game_rooms FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on game_rooms" ON game_rooms;
CREATE POLICY "Allow public update on game_rooms" ON game_rooms FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read on rankings" ON rankings;
CREATE POLICY "Allow public read on rankings" ON rankings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert on rankings" ON rankings;
CREATE POLICY "Allow public insert on rankings" ON rankings FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 3) Realtime 게시판 중복 추가 방지 (멱등성 검사)
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'game_rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
  END IF;
END $$;
