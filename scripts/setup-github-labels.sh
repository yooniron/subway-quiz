#!/usr/bin/env bash
# ==========================================
# GitHub 표준 라벨 동기화 및 생성 스크립트
# ==========================================

echo "🏷️ Subway Quiz 표준 라벨 동기화를 시작합니다..."

create_or_update_label() {
  local name="$1"
  local color="$2"
  local description="$3"

  # 라벨 생성 시도 (--force 플래그로 기존 존재 시 업데이트)
  gh label create "$name" --color "$color" --description "$description" --force 2>/dev/null || \
  gh label edit "$name" --color "$color" --description "$description" 2>/dev/null

  echo "  ✅ [$name] (색상: #$color)"
}

echo "1. 작업 유형 (Type) 라벨 설정 중..."
create_or_update_label "✨ feat" "0052CC" "새로운 기능 추가 (Feature)"
create_or_update_label "🐛 fix" "D73A4A" "버그 및 오류 수정 (Bug fix)"
create_or_update_label "♻️ refactor" "6F42C1" "코드 구조 개선 및 리팩토링"
create_or_update_label "💄 style" "FF8C00" "UI 디자인, CSS, 포맷팅 변경"
create_or_update_label "📝 docs" "0075CA" "README, 기획서, 주석 등 문서 수정"
create_or_update_label "🧪 test" "1D76DB" "Vitest, Playwright 테스트 추가/수정"
create_or_update_label "⚙️ chore" "808080" "패키지 의존성, 빌드 설정, Git 훅"
create_or_update_label "🚀 perf" "E36209" "성능 및 렌더링 최적화"

echo "2. 도메인 영역 (Area) 라벨 설정 중..."
create_or_update_label "📦 area:frontend" "0E8A16" "React 컴포넌트, 페이지, 상태관리"
create_or_update_label "🗄️ area:database" "006B75" "Supabase, PostgreSQL DDL/DML/RPC"
create_or_update_label "🎮 area:gameplay" "5319E7" "퀴즈 출제 엔진, 콤보, 타이머 로직"
create_or_update_label "⚔️ area:multiplayer" "BF5B17" "실시간 1v1 대전, 대기실, Presence"
create_or_update_label "🏆 area:achievement" "D93F0B" "30종 업적, 칭호, 리더보드 시스템"
create_or_update_label "🔐 area:auth" "FBCA04" "Zero-PII 익명 로그인 및 클라우드 동기화"
create_or_update_label "🔄 area:data-sync" "0052A4" "서울교통공사 API 및 전국 노선망 싱크"

echo "3. 상태 및 우선순위 (Status) 라벨 설정 중..."
create_or_update_label "👀 status:in-review" "FBCA04" "코드 리뷰 및 검토 진행 중"
create_or_update_label "✅ status:ready-to-merge" "0E8A16" "검증 완료 및 즉시 머지 가능"
create_or_update_label "🔥 priority:high" "B60205" "긴급/우선 처리 필요"

echo "🎉 모든 표준 라벨 동기화가 완료되었습니다!"
