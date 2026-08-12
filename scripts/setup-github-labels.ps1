# ==========================================
# GitHub 표준 라벨 동기화 및 생성 PowerShell 스크립트
# ==========================================

Write-Host "🏷️ Subway Quiz 표준 라벨 동기화를 시작합니다..." -ForegroundColor Cyan

function Set-GhLabel {
    param(
        [string]$Name,
        [string]$Color,
        [string]$Description
    )

    try {
        gh label create "$Name" --color "$Color" --description "$Description" --force 2>$null
    } catch {
        gh label edit "$Name" --color "$Color" --description "$Description" 2>$null
    }
    Write-Host "  ✅ [$Name] (색상: #$Color)" -ForegroundColor Green
}

Write-Host "`n1. 작업 유형 (Type) 라벨 설정 중..." -ForegroundColor Yellow
Set-GhLabel "✨ feat" "0052CC" "새로운 기능 추가 (Feature)"
Set-GhLabel "🐛 fix" "D73A4A" "버그 및 오류 수정 (Bug fix)"
Set-GhLabel "♻️ refactor" "6F42C1" "코드 구조 개선 및 리팩토링"
Set-GhLabel "💄 style" "FF8C00" "UI 디자인, CSS, 포맷팅 변경"
Set-GhLabel "📝 docs" "0075CA" "README, 기획서, 주석 등 문서 수정"
Set-GhLabel "🧪 test" "1D76DB" "Vitest, Playwright 테스트 추가/수정"
Set-GhLabel "⚙️ chore" "808080" "패키지 의존성, 빌드 설정, Git 훅"
Set-GhLabel "🚀 perf" "E36209" "성능 및 렌더링 최적화"

Write-Host "`n2. 도메인 영역 (Area) 라벨 설정 중..." -ForegroundColor Yellow
Set-GhLabel "📦 area:frontend" "0E8A16" "React 컴포넌트, 페이지, 상태관리"
Set-GhLabel "🗄️ area:database" "006B75" "Supabase, PostgreSQL DDL/DML/RPC"
Set-GhLabel "🎮 area:gameplay" "5319E7" "퀴즈 출제 엔진, 콤보, 타이머 로직"
Set-GhLabel "⚔️ area:multiplayer" "BF5B17" "실시간 1v1 대전, 대기실, Presence"
Set-GhLabel "🏆 area:achievement" "D93F0B" "30종 업적, 칭호, 리더보드 시스템"
Set-GhLabel "🔐 area:auth" "FBCA04" "Zero-PII 익명 로그인 및 클라우드 동기화"
Set-GhLabel "🔄 area:data-sync" "0052A4" "서울교통공사 API 및 전국 노선망 싱크"

Write-Host "`n3. 상태 및 우선순위 (Status) 라벨 설정 중..." -ForegroundColor Yellow
Set-GhLabel "👀 status:in-review" "FBCA04" "코드 리뷰 및 검토 진행 중"
Set-GhLabel "✅ status:ready-to-merge" "0E8A16" "검증 완료 및 즉시 머지 가능"
Set-GhLabel "🔥 priority:high" "B60205" "긴급/우선 처리 필요"

Write-Host "`n🎉 모든 표준 라벨 동기화가 완료되었습니다!" -ForegroundColor Cyan
