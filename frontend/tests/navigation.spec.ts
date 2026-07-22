import { test, expect } from '@playwright/test';

test.describe('Subway Quiz 기본 네비게이션 및 메뉴 로딩 E2E 테스트', () => {
    test('메인 메뉴 페이지가 정상적으로 로드되고 렌더링되어야 합니다.', async ({ page }) => {
        // 메인 메뉴 접속
        await page.goto('/');

        // 타이틀 검증
        await expect(page.locator('h1')).toContainText('Subway Quiz');

        // 싱글플레이어 & 멀티플레이어 버튼 확인
        await expect(page.locator('text=🎯 싱글 타임어택 (60초 챌린지)')).toBeVisible();
        await expect(page.locator('text=실시간 1대1 대전 매칭 시작')).toBeVisible();
    });

    test('노선 선택 모달이 정상적으로 열리고 닫혀야 합니다.', async ({ page }) => {
        await page.goto('/');

        // 싱글 타임어택 클릭 시 노선 선택 모달 오픈
        await page.click('text=🎯 싱글 타임어택 (60초 챌린지)');

        // 모달 헤더 확인
        await expect(page.locator('text=싱글 타임어택 호선 지정')).toBeVisible();

        // 닫기 버튼 작동 확인 (우측 상단 X 버튼 클릭)
        await page.click('button.absolute.top-5.right-5');
        await expect(page.locator('text=싱글 타임어택 호선 지정')).not.toBeVisible();
    });
});
