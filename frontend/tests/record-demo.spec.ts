import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Subway Quiz 실시간 게임 플레이 영상 데모 자동 녹화', () => {

    test('1. 싱글 타임어택 챌린지 플레이 영상 녹화', async ({ browser }) => {
        const mediaDir = path.join(process.cwd(), 'public', 'media');
        if (!fs.existsSync(mediaDir)) {
            fs.mkdirSync(mediaDir, { recursive: true });
        }

        const context = await browser.newContext({
            recordVideo: {
                dir: mediaDir,
                size: { width: 1280, height: 720 }
            },
            viewport: { width: 1280, height: 720 }
        });

        const page = await context.newPage();

        // 1. 메인 메뉴 접속
        await page.goto('/');
        await page.waitForTimeout(1500);

        // 2. 싱글 타임어택 버튼 클릭
        await page.click('text=🎯 싱글 타임어택 (60초 챌린지)');
        await page.waitForTimeout(1500);

        // 3. 노선 지정 모달에서 게임 시작
        await page.click('text=🎯 선택한 호선으로 게임 시작');
        await page.waitForTimeout(2000);

        // 4. 힌트 찬스 클릭 시연
        const hintBtn = page.locator('text=💡 힌트 찬스 사용하기');
        if (await hintBtn.isVisible()) {
            await hintBtn.click();
            await page.waitForTimeout(1500);
        }

        // 5. 정답 입력창에 인풋 입력 시연
        const input = page.locator('input[placeholder*="정답 역명을 입력하세요"]');
        if (await input.isVisible()) {
            await input.fill('서울역');
            await page.waitForTimeout(1000);
            await input.press('Enter');
            await page.waitForTimeout(2000);
        }

        await page.waitForTimeout(3000);
        
        // 영상 저장 완료를 위해 컨텍스트 종료
        const video = page.video();
        const videoPath = video ? await video.path() : null;
        const targetPath = path.join(mediaDir, 'single_demo.webm');

        if (videoPath && fs.existsSync(videoPath)) {
            fs.copyFileSync(videoPath, targetPath);
            console.log(`🎬 싱글 타임어택 시연 영상 녹화 완료: ${targetPath}`);
        }

        await context.close();
    });

    test('2. 1대1 실시간 멀티플레이어 대전 플레이 영상 녹화', async ({ browser }) => {
        test.setTimeout(60000);

        const mediaDir = path.join(process.cwd(), 'public', 'media');
        if (!fs.existsSync(mediaDir)) {
            fs.mkdirSync(mediaDir, { recursive: true });
        }

        // Player 1 (방장) 컨텍스트
        const context1 = await browser.newContext({
            recordVideo: {
                dir: mediaDir,
                size: { width: 1280, height: 720 }
            },
            viewport: { width: 1280, height: 720 }
        });

        // Player 2 (참가자) 컨텍스트
        const context2 = await browser.newContext({
            recordVideo: {
                dir: mediaDir,
                size: { width: 1280, height: 720 }
            },
            viewport: { width: 1280, height: 720 }
        });

        const page1 = await context1.newPage();
        const page2 = await context2.newPage();

        // Step 1: Player 1 대전 로비 진입 & 맞춤 방 개설
        await page1.goto('/');
        await page1.waitForTimeout(1000);
        await page1.click('text=실시간 1대1 대전 매칭 시작');
        await page1.waitForTimeout(1500);

        await page1.click('text=맞춤 방 만들기');
        await page1.waitForTimeout(1000);
        await page1.fill('input[placeholder*="고수 모십니다"]', '지하철 스피드 퀴즈 대전');
        await page1.waitForTimeout(1000);
        await page1.click('button:has-text("방 만들기 ➕")');
        await page1.waitForTimeout(2000);

        // 대기실에서 초대 코드 획득 (예: 코드: A8K9F2)
        const codeElement = page1.locator('span:has-text("코드:")');
        let inviteCode = '';
        if (await codeElement.isVisible()) {
            const fullText = await codeElement.innerText();
            inviteCode = fullText.replace('코드:', '').trim();
        }

        // Step 2: Player 2 초대 코드로 대전방 직통 입장
        await page2.goto('/');
        await page2.waitForTimeout(1000);
        await page2.click('text=실시간 1대1 대전 매칭 시작');
        await page2.waitForTimeout(1500);

        if (inviteCode) {
            await page2.click('text=초대 코드로 입장');
            await page2.waitForTimeout(1000);
            await page2.fill('input[placeholder*="6자리 코드"]', inviteCode);
            await page2.waitForTimeout(1000);
            await page2.click('button:has-text("방 찾아 입장")');
            await page2.waitForTimeout(2500);
        } else {
            // 초대 코드를 가져오지 못한 경우 목록에서 첫 번째 방 클릭
            await page2.click('text=입장하기 ⚔️');
            await page2.waitForTimeout(2500);
        }

        // Step 3: 대기실 연출 (READY 및 이모지 송수신)
        await page2.click('text=READY 준비 완료하기');
        await page2.waitForTimeout(1500);

        // Player 1 대기실에서 이모지 발송 연출
        const emojiBtn1 = page1.locator('button:has-text("🔥")');
        if (await emojiBtn1.isVisible()) {
            await emojiBtn1.click();
            await page1.waitForTimeout(1500);
        }

        // Player 2 대기실에서 이모지 답장 연출
        const emojiBtn2 = page2.locator('button:has-text("😎")');
        if (await emojiBtn2.isVisible()) {
            await emojiBtn2.click();
            await page2.waitForTimeout(1500);
        }

        // Step 4: Player 1 대전 시작 (START!)
        const startBtn = page1.locator('button:has-text("GAME START")');
        if (await startBtn.isVisible()) {
            await startBtn.click();
            await page1.waitForTimeout(3000);
            await page2.waitForTimeout(3000);
        }

        await page1.waitForTimeout(2000);
        await page2.waitForTimeout(2000);

        // 비디오 저장 정리
        const video1 = page1.video();
        const videoPath1 = video1 ? await video1.path() : null;
        const targetPath = path.join(mediaDir, 'multiplayer_demo.webm');

        if (videoPath1 && fs.existsSync(videoPath1)) {
            fs.copyFileSync(videoPath1, targetPath);
            console.log(`⚔️ 1대1 멀티플레이어 시연 영상 녹화 완료: ${targetPath}`);
        }

        await context1.close();
        await context2.close();
    });
});
