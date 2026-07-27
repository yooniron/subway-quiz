-- ==========================================
-- 1호선 ~ 9호선 기본 노선 데이터 마스터 인서트
-- ==========================================
INSERT INTO lines (id, line_name, color_code) VALUES
(1, '1호선', '#0052A4'),
(2, '2호선', '#00A84D'),
(3, '3호선', '#EF7C1C'),
(4, '4호선', '#00A5DE'),
(5, '5호선', '#996CAD'),
(6, '6호선', '#CD7C2F'),
(7, '7호선', '#747F00'),
(8, '8호선', '#EA545D'),
(9, '9호선', '#BDB092')
ON CONFLICT (id) DO UPDATE 
SET line_name = EXCLUDED.line_name, color_code = EXCLUDED.color_code;
