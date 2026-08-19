import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const readmePath = path.join(rootDir, 'README.md');

function updateReadmeLogs() {
  console.log('🔄 Git 히스토리에서 최신 주요 릴리즈 내역을 파싱합니다...');

  if (!fs.existsSync(readmePath)) {
    console.error(`❌ README.md 파일을 찾을 수 없습니다: ${readmePath}`);
    process.exit(1);
  }

  let gitOutput = '';
  try {
    gitOutput = execSync(
      'git log --no-merges --grep="^feat\\|^fix\\|^refactor\\|^perf" -n 30 --format="%s (%ad)" --date=short',
      { cwd: rootDir, encoding: 'utf-8' }
    );
  } catch (err) {
    console.error('❌ git log 조회 실패:', err);
    process.exit(1);
  }

  const rawLines = gitOutput
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  // 중복 제거 및 상위 12개 추출
  const uniqueLogs = Array.from(new Set(rawLines)).slice(0, 12);

  let formattedLogs = '';
  if (uniqueLogs.length === 0) {
    formattedLogs = '- 최근에 기록된 주요 기능 변경 내역이 없습니다.';
  } else {
    formattedLogs = uniqueLogs.map(log => `- ${log}`).join('\n');
  }

  const readmeContent = fs.readFileSync(readmePath, 'utf-8');
  const startTag = '<!-- RELEASE_LOGS_START -->';
  const endTag = '<!-- RELEASE_LOGS_END -->';

  const startIndex = readmeContent.indexOf(startTag);
  const endIndex = readmeContent.indexOf(endTag);

  if (startIndex === -1 || endIndex === -1) {
    console.error(`❌ README.md 내에 ${startTag} 또는 ${endTag} 태그가 없습니다.`);
    process.exit(1);
  }

  const newReadme =
    readmeContent.slice(0, startIndex + startTag.length) +
    '\n' +
    formattedLogs +
    '\n' +
    readmeContent.slice(endIndex);

  fs.writeFileSync(readmePath, newReadme, 'utf-8');
  console.log('✨ README.md 릴리즈 로그가 최신 내역으로 성공적으로 업데이트되었습니다!');
}

updateReadmeLogs();
