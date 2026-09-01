import { test, expect } from '@playwright/test';

test.describe('Subway Quiz 기본 네비게이션 및 E2E 기능 검증 테스트', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        const lastError = await page.evaluate(() => (window as any).__LAST_ERROR__);
        if (lastError) {
            console.error("🔴 Browser Runtime Error:", lastError);
        }
    });

    test('메인 메뉴 페이지가 정상적으로 로드되고 렌더링되어야 합니다.', async ({ page }) => {
        // 타이틀 검증
        await expect(page.locator('h1')).toContainText('Subway Quiz');

        // 메인 메뉴 주요 액션 버튼 노출 확인
        await expect(page.getByRole('button', { name: /8인 파티룸/ })).toBeVisible();
        await expect(page.getByRole('button', { name: /실시간 1대1 대전/ })).toBeVisible();
        await expect(page.getByRole('button', { name: /싱글 타임어택/ })).toBeVisible();
        await expect(page.getByRole('button', { name: /연습 모드/ })).toBeVisible();
    });

    test('노선 선택 모달이 정상적으로 열리고 닫혀야 합니다.', async ({ page }) => {
        // 싱글 타임어택 클릭 시 노선 선택 모달 오픈
        await page.getByRole('button', { name: /싱글 타임어택/ }).click();

        // 모달 헤더 확인
        await expect(page.getByText('싱글 타임어택 호선 지정')).toBeVisible();

        // 닫기 버튼 작동 확인
        await page.click('button.absolute.top-5.right-5');
        await expect(page.getByText('싱글 타임어택 호선 지정')).not.toBeVisible();
    });

    test('🎮 8인 파티룸 대기실 모달이 정상적으로 오픈되고 6자리 초대코드가 생성되어야 합니다.', async ({ page }) => {
        // 8인 파티룸 버튼 클릭
        await page.getByRole('button', { name: /8인 파티룸/ }).click();

        // 파티룸 대기실 모달 렌더링 검증
        await expect(page.getByText('지하철 8인 스피드 다인전 서바이벌')).toBeVisible();
        await expect(page.getByText(/초대 코드:/)).toBeVisible();
        await expect(page.getByText(/PARTY-/)).toBeVisible();

        // 닫기 버튼으로 퇴장 확인
        await page.click('button.absolute.top-5.right-5');
        await expect(page.getByText('지하철 8인 스피드 다인전 서바이벌')).not.toBeVisible();
    });

    test('📊 나의 통계 대시보드 모달이 정상적으로 열리고 닫혀야 합니다.', async ({ page }) => {
        // 나의 통계 버튼 클릭
        await page.getByRole('button', { name: /나의 통계/ }).click();

        // 통계 모달 타이틀 및 카드 렌더링 검증
        await expect(page.getByText('나의 플레이 통계 대시보드')).toBeVisible();
        await expect(page.getByText('주요 레코드 성과')).toBeVisible();
        await expect(page.getByText('최다 정답 노선 TOP 3')).toBeVisible();

        // 닫기 버튼 클릭
        await page.getByRole('button', { name: '닫기' }).click();
        await expect(page.getByText('나의 플레이 통계 대시보드')).not.toBeVisible();
    });

    test('🏆 업적 모달이 정상적으로 열리고 닫혀야 합니다.', async ({ page }) => {
        // 업적 버튼 클릭
        await page.getByRole('button', { name: /업적/ }).click();

        // 업적 모달 타이틀 검증
        await expect(page.getByText('업적 & 칭호 보관함')).toBeVisible();

        // 닫기 버튼 클릭
        await page.click('div.border-b button');
        await expect(page.getByText('업적 & 칭호 보관함')).not.toBeVisible();
    });
});
