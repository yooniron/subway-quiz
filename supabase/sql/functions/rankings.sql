-- ==========================================
-- 싱글모드 명예의 전당 랭킹 Stored Procedures
-- ==========================================

-- [RPC 1] 호선별/전체 명예의 전당 랭킹 조회 함수
CREATE OR REPLACE FUNCTION get_rankings_by_line(
  p_line_id INT DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  player_id UUID,
  nickname VARCHAR,
  score INT,
  line_summary VARCHAR,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  IF p_line_id IS NULL THEN
    RETURN QUERY
    SELECT r.id, r.player_id, r.nickname, r.score, r.line_summary, r.created_at
    FROM rankings r
    ORDER BY r.score DESC, r.created_at ASC
    LIMIT 50;
  ELSE
    RETURN QUERY
    SELECT r.id, r.player_id, r.nickname, r.score, r.line_summary, r.created_at
    FROM rankings r
    WHERE p_line_id = ANY(r.line_ids)
    ORDER BY r.score DESC, r.created_at ASC
    LIMIT 50;
  END IF;
END;
$$ LANGUAGE plpgsql;
