# ⚠️ [실행 방법] 이 마크다운 내의 전체 텍스트를 gemini.md 파일로 저장한 뒤,
# 터미널에서 아래 한 줄을 실행하면 프로젝트가 완전 자동으로 빌드됩니다:
#
# bash gemini.md
#

echo "🚀 [Subway Quiz] 대문자 스키마 기반 자동 빌드를 시작합니다..."

# 1. 디렉토리 구조 생성
mkdir -p subway-quiz/data-sync
mkdir -p subway-quiz/supabase
mkdir -p subway-quiz/frontend
cd subway-quiz

# 2. data-sync 패키지 및 환경 설정
cd data-sync
cat << 'EOF' > package.json
{
  "name": "data-sync",
  "version": "1.0.0",
  "description": "",
  "main": "sync.ts",
  "scripts": {
    "sync": "tsx sync.ts"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "axios": "^1.6.0",
    "dotenv": "^16.3.0"
  },
  "devDependencies": {
    "tsx": "^4.0.0",
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
EOF

cat << 'EOF' > tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true
  }
}
EOF

cat << 'EOF' > .env
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATA_GO_KR_KEY=your-public-data-api-key
EOF

cat << 'EOF' > sync.ts
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DATA_GO_KR_KEY = process.env.DATA_GO_KR_KEY!;

async function main() {
  console.log("🔄 공공데이터 API 수집 가동...");
  try {
    const response = await axios.get(`http://apis.data.go.kr/1613000/SubwayInfoService/getKwazuluSubwaySttnList`, {
      params: {
        serviceKey: DATA_GO_KR_KEY,
        numOfRows: 1000,
        _type: 'json'
      }
    });

    const items = response.data?.response?.body?.items?.item || [];
    
    for (const item of items) {
      await supabase.from('STATIONS').upsert({
        ID: parseInt(item.subwayStationId),
        STATION_NAME: item.subwayStationName,
        LATITUDE: item.latitude || null,
        LONGITUDE: item.longitude || null
      });
    }
    console.log(`✅ ${items.length}개 역 마스터 적재 완료`);

    const testEdges = [
      { LINE_ID: 2, FROM_STATION_ID: 234, TO_STATION_ID: 235 }, 
      { LINE_ID: 2, FROM_STATION_ID: 235, TO_STATION_ID: 236 }, 
      { LINE_ID: 2, FROM_STATION_ID: 236, TO_STATION_ID: 237 }, 
      { LINE_ID: 2, FROM_STATION_ID: 237, TO_STATION_ID: 238 }, 
      { LINE_ID: 2, FROM_STATION_ID: 238, TO_STATION_ID: 239 }, 
      { LINE_ID: 2, FROM_STATION_ID: 235, TO_STATION_ID: 234 },
      { LINE_ID: 2, FROM_STATION_ID: 236, TO_STATION_ID: 235 },
      { LINE_ID: 2, FROM_STATION_ID: 237, TO_STATION_ID: 236 },
      { LINE_ID: 2, FROM_STATION_ID: 238, TO_STATION_ID: 237 },
      { LINE_ID: 2, FROM_STATION_ID: 239, TO_STATION_ID: 238 }
    ];

    await supabase.from('STATION_CONNECTIONS').upsert(testEdges);
    console.log("✅ 인접역 그래프 매핑 엣지 주입 완료!");
  } catch (err) {
    console.error("❌ 오류 발생:", err);
  }
}

main();
EOF

npm install
cd ..

# 3. Supabase SQL 마이그레이션 파일 백업 생성
cat << 'EOF' > supabase/schema.sql
-- 1. 역 정보 마스터 테이블
CREATE TABLE STATIONS (
  ID INT PRIMARY KEY,
  STATION_NAME VARCHAR(100) NOT NULL,
  LATITUDE DECIMAL(10, 8),
  LONGITUDE DECIMAL(11, 8)
);

-- 2. 지하철 노선 마스터 테이블
CREATE TABLE LINES (
  ID INT PRIMARY KEY,
  LINE_NAME VARCHAR(50) NOT NULL,
  COLOR_CODE VARCHAR(7) NOT NULL
);

-- 3. 역 간 연결 관계 테이블 (인접 그래프 모델)
CREATE TABLE STATION_CONNECTIONS (
  ID SERIAL PRIMARY KEY,
  LINE_ID INT REFERENCES LINES(ID) ON DELETE CASCADE,
  FROM_STATION_ID INT REFERENCES STATIONS(ID) ON DELETE CASCADE,
  TO_STATION_ID INT REFERENCES STATIONS(ID) ON DELETE CASCADE,
  CONSTRAINT UNIQUE_CONNECTION UNIQUE (LINE_ID, FROM_STATION_ID, TO_STATION_ID)
);

-- 4. 실시간 게임 대전방 테이블
CREATE TABLE GAME_ROOMS (
  ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  PLAYER_1 UUID,
  PLAYER_2 UUID,
  CURRENT_TURN UUID,
  CURRENT_STATION_ID INT REFERENCES STATIONS(ID),
  P1_SCORE INT DEFAULT 0,
  P2_SCORE INT DEFAULT 0,
  STATUS VARCHAR(20) DEFAULT 'WAITING', 
  CREATED_AT TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 노선 데이터 마스터 테이블 인서트
INSERT INTO LINES (ID, LINE_NAME, COLOR_CODE) VALUES
(1, '1호선', '#0052A4'),
(2, '2호선', '#00A84D'),
(3, '3호선', '#EF7C1C'),
(4, '4호선', '#00A5DE'),
(9, '9호선', '#BDB092');

-- [RPC 1] 대문자 대응 실시간 매치메이킹 함수 정의
CREATE OR REPLACE FUNCTION JOIN_OR_CREATE_ROOM(P_PLAYER_ID UUID)
RETURNS TABLE (
  ROOM_ID UUID,
  PLAYER_ROLE VARCHAR
) AS $$
DECLARE
  V_ROOM_ID UUID;
BEGIN
  SELECT ID INTO V_ROOM_ID
  FROM GAME_ROOMS
  WHERE STATUS = 'WAITING' AND PLAYER_1 != P_PLAYER_ID
  ORDER BY CREATED_AT ASC
  LIMIT 1
  FOR UPDATE;

  IF V_ROOM_ID IS NOT NULL THEN
    UPDATE GAME_ROOMS
    SET 
      PLAYER_2 = P_PLAYER_ID,
      STATUS = 'PLAYING',
      CURRENT_TURN = PLAYER_1 
    WHERE ID = V_ROOM_ID;
    
    RETURN QUERY SELECT V_ROOM_ID, 'PLAYER_2'::VARCHAR;
  ELSE
    INSERT INTO GAME_ROOMS (PLAYER_1, STATUS)
    VALUES (P_PLAYER_ID, 'WAITING')
    RETURNING ID INTO V_ROOM_ID;
    
    RETURN QUERY SELECT V_ROOM_ID, 'PLAYER_1'::VARCHAR;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- [RPC 2] 대문자 대응 BFS 그래프 힌트 빌더 함수 정의
CREATE OR REPLACE FUNCTION GET_SUBWAY_QUIZ(P_ROOM_ID UUID)
RETURNS TABLE (
  TARGET_STATION_ID INT,
  TARGET_STATION_NAME VARCHAR,
  LINE_NAME VARCHAR,
  COLOR_CODE VARCHAR,
  LEFT_2 VARCHAR,
  LEFT_1 VARCHAR,
  RIGHT_1 VARCHAR,
  RIGHT_2 VARCHAR
) AS $$
DECLARE
  V_TARGET_ID INT;
  V_LINE_ID INT;
BEGIN
  SELECT FROM_STATION_ID, LINE_ID INTO V_TARGET_ID, V_LINE_ID
  FROM STATION_CONNECTIONS
  ORDER BY random()
  LIMIT 1;

  UPDATE GAME_ROOMS 
  SET CURRENT_STATION_ID = V_TARGET_ID 
  WHERE ID = P_ROOM_ID;

  RETURN QUERY
  WITH RECURSIVE BFS_HINT AS (
    SELECT 
      FROM_STATION_ID AS STATION_ID, 
      0 AS DEPTH,
      ARRAY[FROM_STATION_ID] AS PATH
    FROM STATION_CONNECTIONS
    WHERE FROM_STATION_ID = V_TARGET_ID AND LINE_ID = V_LINE_ID

    UNION ALL

    SELECT 
      C.TO_STATION_ID, 
      BH.DEPTH + 1,
      BH.PATH || C.TO_STATION_ID
    FROM STATION_CONNECTIONS C
    JOIN BFS_HINT BH ON C.FROM_STATION_ID = BH.STATION_ID
    WHERE C.LINE_ID = V_LINE_ID 
      AND BH.DEPTH < 2
      AND NOT (C.TO_STATION_ID = ANY(BH.PATH))
  )
  SELECT 
    V_TARGET_ID AS TARGET_STATION_ID,
    (SELECT STATION_NAME FROM STATIONS WHERE ID = V_TARGET_ID) AS TARGET_STATION_NAME,
    L.LINE_NAME,
    L.COLOR_CODE,
    (SELECT STATION_NAME FROM STATIONS WHERE ID = (SELECT STATION_ID FROM BFS_HINT WHERE DEPTH = 2 ORDER BY STATION_ID LIMIT 1)) AS LEFT_2,
    (SELECT STATION_NAME FROM STATIONS WHERE ID = (SELECT STATION_ID FROM BFS_HINT WHERE DEPTH = 1 ORDER BY STATION_ID LIMIT 1)) AS LEFT_1,
    (SELECT STATION_NAME FROM STATIONS WHERE ID = (SELECT STATION_ID FROM BFS_HINT WHERE DEPTH = 1 ORDER BY STATION_ID DESC LIMIT 1)) AS RIGHT_1,
    (SELECT STATION_NAME FROM STATIONS WHERE ID = (SELECT STATION_ID FROM BFS_HINT WHERE DEPTH = 2 ORDER BY STATION_ID DESC LIMIT 1)) AS RIGHT_2
  FROM LINES L
  WHERE L.ID = V_LINE_ID;
END;
$$ LANGUAGE plpgsql;
EOF

# 4. 프론트엔드 React 프로젝트 템플릿 생성 및 의존성 주입
cd frontend
npm init vite@latest . -- --template react-ts

cat << 'EOF' > package.json
{
  "name": "subway-quiz-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "canvas-confetti": "^1.6.0",
    "lucide-react": "^0.300.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/canvas-confetti": "^1.6.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@typescript-eslint/eslint-plugin": "^6.10.0",
    "@typescript-eslint/parser": "^6.10.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "typescript": "^5.2.2",
    "vite": "^5.0.0"
  }
}
EOF

cat << 'EOF' > tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

cat << 'EOF' > src/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

cat << 'EOF' > src/App.tsx
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Train, Send, Trophy, Users } from 'lucide-react';
import confetti from 'canvas-confetti';

const supabase = createClient(
  'https://your-supabase-project.supabase.co', 
  'your-anon-key'                             
);

interface Quiz {
  target_station_id: number;
  target_station_name: string;
  line_name: string;
  color_code: string;
  left_2: string;
  left_1: string;
  right_1: string;
  right_2: string;
}

export default function App() {
  const [myId] = useState<string>(() => {
    const saved = localStorage.getItem('subway_user_id');
    if (saved) return saved;
    const newId = crypto.randomUUID();
    localStorage.setItem('subway_user_id', newId);
    return newId;
  });

  const [roomId, setRoomId] = useState<string | null>(null);
  const [role, setRole] = useState<'player_1' | 'player_2' | null>(null);
  const [roomStatus, setRoomStatus] = useState<'WAITING' | 'PLAYING' | 'FINISHED'>('WAITING');
  const [turnPlayer, setTurnPlayer] = useState<string | null>(null);
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [quiz, setQuiz] = useState<Quiz null |>(null);

  const [userInput, setUserInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);

  const startMatchmaking = async () => {
    const { data, error } = await supabase.rpc('join_or_create_room', { p_player_id: myId });
    if (error) return alert("매칭 에러: " + error.message);
    if (data && data.length > 0) {
      setRoomId(data[0].room_id);
      setRole(data[0].player_role as any);
    }
  };

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'GAME_ROOMS',
        filter: `id=eq.${roomId}`
      }, async (payload) => {
        const data = payload.new;
        setRoomStatus(data.STATUS);
        setTurnPlayer(data.CURRENT_TURN);
        setScores({ p1: data.P1_SCORE, p2: data.P2_SCORE });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  useEffect(() => {
    if (roomStatus === 'PLAYING' && roomId) {
      loadQuiz();
    }
  }, [roomStatus, roomId]);

  const loadQuiz = async () => {
    const { data } = await supabase.rpc('get_subway_quiz', { p_room_id: roomId });
    if (data && data.length > 0) {
      setQuiz({
        target_station_id: data[0].target_station_id,
        target_station_name: data[0].target_station_name,
        line_name: data[0].line_name,
        color_code: data[0].color_code,
        left_2: data[0].left_2,
        left_1: data[0].left_1,
        right_1: data[0].right_1,
        right_2: data[0].right_2
      });
      setTimeLeft(30);
      setUserInput('');
    }
  };

  useEffect(() => {
    if (roomStatus !== 'PLAYING' || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, roomStatus]);

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz || myId !== turnPlayer) return;

    const cleanInput = userInput.trim().replace(/역$/, '');
    const cleanTarget = quiz.target_station_name.replace(/역$/, '');

    if (cleanInput === cleanTarget) {
      confetti({ particleCount: 80, spread: 60 });
      const scoreKey = role === 'player_1' ? 'P1_SCORE' : 'P2_SCORE';
      const addedScore = timeLeft > 20 ? 100 : timeLeft > 10 ? 50 : 20;

      const nextTurn = role === 'player_1' ? 'player_2' : 'player_1'; 
      await supabase.from('GAME_ROOMS').update({
        [scoreKey]: (role === 'player_1' ? scores.p1 : scores.p2) + addedScore,
        CURRENT_TURN: nextTurn
      }).eq('id', roomId);
      
      loadQuiz();
    } else {
      alert("틀렸습니다! 다시 생각해 보세요.");
      setUserInput('');
    }
  };

  const showL1 = timeLeft <= 20;
  const showL2 = timeLeft <= 10;

  if (!roomId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white font-sans px-4">
        <Train className="w-16 h-16 text-yellow-400 mb-6 animate-bounce"/>
        <h1 className="text-3xl font-extrabold mb-2">Subway Quiz</h1>
        <p className="text-gray-400 mb-8 text-center max-w-sm">실시간 지하철 노선 네트워크를 활용한 1대1 상호 대전 매칭 플랫폼</p>
        <button 
          onClick={startMatchmaking}
          className="px-8 py-4 bg-yellow-400 hover:bg-yellow-500 text-gray-950 font-bold text-lg rounded-2xl shadow-lg transition-transform transform hover:scale-105"
        >
          실시간 대전 매칭 시작
        </button>
      </div>
    );
  }

  if (roomStatus === 'WAITING') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white px-4">
        <Users className="w-16 h-16 text-blue-400 mb-4 animate-pulse"/>
        <h2 className="text-2xl font-bold">상대 플레이어 대기 중...</h2>
        <p className="text-gray-500 mt-2 text-sm font-mono">Room ID: {roomId}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 text-white">
      <div className="flex gap-6 mb-8 w-full max-w-md justify-between bg-gray-900 border border-gray-800 p-4 rounded-2xl">
        <div className="text-center">
          <p className="text-xs text-gray-500">Player 1 (나)</p>
          <p className="text-2xl font-black font-mono text-blue-400">{scores.p1}</p>
        </div>
        <div className="flex flex-col items-center justify-center">
          <span className="text-xs bg-yellow-400 text-gray-950 px-3 py-1 rounded-full font-bold">
            {myId === turnPlayer ? "내 공격 차례! 🔥" : "상대 대기 중 ⏱️"}
          </span>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Player 2 (상대)</p>
          <p className="text-2xl font-black font-mono text-red-400">{scores.p2}</p>
        </div>
      </div>

      {quiz && (
        <div className="w-full max-w-2xl rounded-3xl bg-gray-900 p-8 border border-gray-800 shadow-2xl text-center">
          <div className="flex justify-center mb-6">
            <span 
              className="px-6 py-2 rounded-full font-black text-sm text-white tracking-wider shadow-md"
              style={{ backgroundColor: quiz.color_code }}
            >
              {quiz.line_name}
            </span>
          </div>

          <div className="relative flex items-center justify-between w-full px-2 py-8 mb-8">
            <div className="absolute left-0 right-0 h-3 -z-10 rounded-full" style={{ backgroundColor: quiz.color_code, top: '42%' }} />
            
            <div className={`flex flex-col items-center w-1/5 transition-all ${showL2 ? 'opacity-100' : 'opacity-20 blur-xs'}`}>
              <div className="w-8 h-8 rounded-full border-4 border-white bg-gray-950" />
              <span className="mt-2 text-xs font-bold">{showL2 ? quiz.left_2 : '?'}</span>
            </div>
            
            <div className={`flex flex-col items-center w-1/5 transition-all ${showL1 ? 'opacity-100' : 'opacity-20 blur-xs'}`}>
              <div className="w-8 h-8 rounded-full border-4 border-white bg-gray-950" />
              <span className="mt-2 text-xs font-bold">{showL1 ? quiz.left_1 : '?'}</span>
            </div>

            <div className="flex flex-col items-center w-1/5">
              <div className="w-12 h-12 rounded-full border-4 border-yellow-400 bg-white flex items-center justify-center animate-bounce">
                <span className="text-gray-950 font-black text-lg">?</span>
              </div>
              <span className="mt-2 text-xs font-bold text-yellow-400">[ 정답 ]</span>
            </div>

            <div className={`flex flex-col items-center w-1/5 transition-all ${showL1 ? 'opacity-100' : 'opacity-20 blur-xs'}`}>
              <div className="w-8 h-8 rounded-full border-4 border-white bg-gray-950" />
              <span className="mt-2 text-xs font-bold">{showL1 ? quiz.right_1 : '?'}</span>
            </div>

            <div className={`flex flex-col items-center w-1/5 transition-all ${showL2 ? 'opacity-100' : 'opacity-20 blur-xs'}`}>
              <div className="w-8 h-8 rounded-full border-4 border-white bg-gray-950" />
              <span className="mt-2 text-xs font-bold">{showL2 ? quiz.right_2 : '?'}</span>
            </div>
          </div>

          <form onSubmit={handleAnswerSubmit} className="flex gap-2 max-w-sm mx-auto">
            <input
              type="text"
              disabled={myId !== turnPlayer}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={myId === turnPlayer ? "정답 입력..." : "상대방의 턴입니다."}
              className="flex-1 px-4 py-3 rounded-xl bg-gray-950 border border-gray-800 text-white focus:outline-none focus:border-yellow-400 disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={myId !== turnPlayer}
              className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-700 text-gray-950 font-bold rounded-xl transition-all"
            >
              <Send className="w-4 h-4"/>
            </button>
          </form>

          <p className="mt-4 text-xs text-red-400 font-mono">⏱️ 다음 역 힌트 확장까지 남은 시간: {timeLeft}초</p>
        </div>
      )}
    </div>
  );
}
EOF

npm install
cd ..

echo "✅ 모든 프로젝트 패키지 셋업 완료!"
echo "👉 다음 단계:"
echo " 1. 'supabase/schema.sql'의 쿼리를 복사해 Supabase SQL Editor에서 실행하세요."
echo " 2. 'data-sync/.env' 와 'frontend/src/App.tsx' 에 본인의 Supabase 및 공공데이터 API Key 정보를 업데이트하세요."
echo " 3. 'cd data-sync && npm run sync'로 데이터베이스에 마스터 역 리스트를 싱크하세요."
echo " 4. 'cd frontend && npm run dev'로 리액트 로컬 서버를 가동하세요!"