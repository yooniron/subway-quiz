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

async function backupRankings() {
  console.log("📦 [Subway Quiz] rankings 테이블 백업을 시작합니다...");

  try {
    const { data: rankings, error } = await supabase
      .from('rankings')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    const backupDir = path.join(__dirname, '../../supabase/backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `rankings_backup_${timestamp}.json`;
    const latestFilename = `rankings_latest.json`;
    const filePath = path.join(backupDir, filename);
    const latestPath = path.join(backupDir, latestFilename);

    const payload = JSON.stringify({
      backed_at: new Date().toISOString(),
      count: rankings.length,
      data: rankings
    }, null, 2);

    fs.writeFileSync(filePath, payload, 'utf-8');
    fs.writeFileSync(latestPath, payload, 'utf-8');

    console.log(`✅ 백업 성공! 총 ${rankings.length}건의 랭킹 기록이 보존되었습니다.`);
    console.log(`📄 파일 경로: ${filePath}`);
    console.log(`📄 최신 파일 경로: ${latestPath}`);
  } catch (err: any) {
    console.error("❌ 백업 도중 오류가 발생하였습니다:", err.message || err);
  }
}

backupRankings();
