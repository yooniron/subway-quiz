import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreRankings() {
  console.log("🔄 [Subway Quiz] rankings 테이블 복원을 시작합니다...");

  try {
    const backupDir = path.join(__dirname, '../../supabase/backups');
    const latestPath = path.join(backupDir, 'rankings_latest.json');

    if (!fs.existsSync(latestPath)) {
      console.error("❌ 최신 백업 파일(rankings_latest.json)을 찾을 수 없습니다.");
      process.exit(1);
    }

    const rawData = fs.readFileSync(latestPath, 'utf-8');
    const payload = JSON.parse(rawData);

    if (!payload.data || !Array.isArray(payload.data) || payload.data.length === 0) {
      console.log("ℹ️ 복원할 백업 랭킹 데이터가 비어 있습니다.");
      return;
    }

    console.log(`📥 총 ${payload.data.length}건의 백업 기록을 복원합니다...`);

    const { error } = await supabase
      .from('rankings')
      .upsert(payload.data, { onConflict: 'id' });

    if (error) {
      throw error;
    }

    console.log(`✅ 랭킹 데이터 복원 완료! 총 ${payload.data.length}건이 복구되었습니다.`);
  } catch (err: any) {
    console.error("❌ 복원 도중 오류가 발생하였습니다:", err.message || err);
  }
}

restoreRankings();
