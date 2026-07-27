-- ==========================================
-- Row Level Security (RLS) 및 접근 정책 설정
-- ==========================================

-- 1) RLS 활성화
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE station_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;

-- 2) stations, lines, station_connections: 익명/인증 사용자 모든 읽기 허용 정책
CREATE POLICY "Allow public read on stations" ON stations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read on lines" ON lines FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read on station_connections" ON station_connections FOR SELECT TO anon, authenticated USING (true);

-- 3) game_rooms: 모든 익명 사용자 읽기, 삽입, 갱신 허용 정책
CREATE POLICY "Allow public read on game_rooms" ON game_rooms FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert on game_rooms" ON game_rooms FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update on game_rooms" ON game_rooms FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- 4) rankings: 모든 익명 사용자 읽기, 삽입 허용 정책
CREATE POLICY "Allow public read on rankings" ON rankings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert on rankings" ON rankings FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 5) game_rooms 테이블에 대한 실시간 변경 감지(Realtime) 게시 설정 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
