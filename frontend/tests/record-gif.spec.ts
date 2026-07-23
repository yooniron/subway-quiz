import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import { GifWriter } from 'omggif';

async function createGifFromScreenshots(screenshots: Buffer[], outputPath: string, delayCentiseconds: number = 20) {
    if (screenshots.length === 0) return;

    const firstPng = PNG.sync.read(screenshots[0]);
    const width = firstPng.width;
    const height = firstPng.height;

    const buf = Buffer.alloc(width * height * screenshots.length * 2 + 1024 * 1024);
    const gifWriter = new GifWriter(buf, width, height, { loop: 0 });

    for (const pngBuf of screenshots) {
        const png = PNG.sync.read(pngBuf);
        const palette: number[] = [];
        const paletteMap = new Map<number, number>();
        const pixels = new Uint8Array(width * height);

        for (let i = 0; i < png.data.length; i += 4) {
            const r = png.data[i] & 0xe0;
            const g = png.data[i + 1] & 0xe0;
            const b = png.data[i + 2] & 0xc0;
            const color = (r << 16) | (g << 8) | b;
            
            let colorIndex = paletteMap.get(color);
            if (colorIndex === undefined) {
                if (palette.length < 256) {
                    colorIndex = palette.length;
                    palette.push(color);
                    paletteMap.set(color, colorIndex);
                } else {
                    colorIndex = 0;
                }
            }
            pixels[i / 4] = colorIndex;
        }

        while (palette.length < 2 || (palette.length & (palette.length - 1)) !== 0) {
            palette.push(0);
        }

        gifWriter.addFrame(0, 0, width, height, pixels, {
            palette: palette,
            delay: delayCentiseconds
        });
    }

    const gifBuffer = buf.subarray(0, gifWriter.end());
    fs.writeFileSync(outputPath, gifBuffer);
    console.log(`🎉 GIF 애니메이션 자동 생성 완료: ${outputPath} (${(gifBuffer.length / 1024).toFixed(1)} KB)`);
}

test.describe('Subway Quiz GitHub README 용 GIF 애니메이션 자동 캡처', () => {
    test.describe.configure({ mode: 'serial' });

    test('1. 싱글 타임어택 챌린지 GIF 생성', async ({ page }) => {
        test.setTimeout(60000);
        const mediaDir = path.join(process.cwd(), 'public', 'media');
        if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });

        await page.setViewportSize({ width: 960, height: 540 });
        const screenshots: Buffer[] = [];

        const captureScreen = async () => {
            const shot = await page.screenshot({ type: 'png' });
            screenshots.push(shot);
        };

        // 메인 메뉴 접속
        await page.goto('/');
        await captureScreen();

        // 싱글 타임어택 버튼 클릭
        await page.click('text=🎯 싱글 타임어택 (60초 챌린지)');
        for (let i = 0; i < 4; i++) {
            await page.waitForTimeout(250);
            await captureScreen();
        }

        // 노선 지정 모달에서 게임 시작
        await page.click('text=🎯 선택한 호선으로 게임 시작');
        for (let i = 0; i < 6; i++) {
            await page.waitForTimeout(250);
            await captureScreen();
        }

        // 힌트 찬스 클릭 시연
        const hintBtn = page.locator('text=💡 힌트 찬스 사용하기');
        if (await hintBtn.isVisible()) {
            await hintBtn.click();
            for (let i = 0; i < 4; i++) {
                await page.waitForTimeout(250);
                await captureScreen();
            }
        }

        // 정답 입력 시연
        const input = page.locator('input[placeholder*="정답 역명을 입력하세요"]');
        if (await input.isVisible()) {
            await input.fill('서울역');
            await captureScreen();
            await page.waitForTimeout(300);
            await input.press('Enter');
            for (let i = 0; i < 6; i++) {
                await page.waitForTimeout(250);
                await captureScreen();
            }
        }

        const targetGifPath = path.join(mediaDir, 'single_demo.gif');
        await createGifFromScreenshots(screenshots, targetGifPath, 25);
    });

    test('2. 1대1 실시간 멀티플레이어 대전 GIF 생성', async ({ browser }) => {
        test.setTimeout(90000);
        const mediaDir = path.join(process.cwd(), 'public', 'media');
        if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });

        const context1 = await browser.newContext({ viewport: { width: 960, height: 540 } });
        const context2 = await browser.newContext({ viewport: { width: 960, height: 540 } });

        const page1 = await context1.newPage();
        const page2 = await context2.newPage();

        const screenshots: Buffer[] = [];
        const captureScreen = async () => {
            const shot = await page1.screenshot({ type: 'png' });
            screenshots.push(shot);
        };

        // Step 1: Player 1 방 개설
        await page1.goto('/');
        await captureScreen();
        await page1.click('text=실시간 1대1 대전 매칭 시작');
        await page1.waitForTimeout(500);
        await captureScreen();

        await page1.click('text=맞춤 방 만들기');
        await page1.waitForTimeout(500);
        await page1.fill('input[placeholder*="고수 모십니다"]', '스피드 퀴즈 대전!');
        await captureScreen();
        await page1.click('button:has-text("방 만들기 ➕")');
        
        for (let i = 0; i < 5; i++) {
            await page1.waitForTimeout(300);
            await captureScreen();
        }

        // 초대코드 획득
        const codeElement = page1.locator('span:has-text("코드:")');
        let inviteCode = '';
        if (await codeElement.isVisible()) {
            const fullText = await codeElement.innerText();
            inviteCode = fullText.replace('코드:', '').trim();
        }

        // Step 2: Player 2 초대코드로 직통 조인
        await page2.goto('/');
        await page2.click('text=실시간 1대1 대전 매칭 시작');
        await page2.waitForTimeout(500);

        if (inviteCode) {
            await page2.click('text=초대 코드로 입장');
            await page2.waitForTimeout(500);
            await page2.fill('input[placeholder*="6자리 코드"]', inviteCode);
            await page2.click('button:has-text("방 찾아 입장")');
            
            for (let i = 0; i < 6; i++) {
                await page1.waitForTimeout(300);
                await captureScreen();
            }
        }

        // Step 3: Player 2 레디 및 대기실 이모지 연출
        const readyBtn = page2.locator('text=READY 준비 완료하기');
        if (await readyBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await readyBtn.click();
            for (let i = 0; i < 4; i++) {
                await page1.waitForTimeout(300);
                await captureScreen();
            }
        }

        const emojiBtn1 = page1.locator('button:has-text("🔥")');
        if (await emojiBtn1.isVisible({ timeout: 3000 }).catch(() => false)) {
            await emojiBtn1.click();
            for (let i = 0; i < 4; i++) {
                await page1.waitForTimeout(300);
                await captureScreen();
            }
        }

        // Step 4: Player 1 GAME START 클릭 ➡️ 인게임 대전 진입
        const startBtn = page1.locator('button:has-text("GAME START")');
        if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await startBtn.click();
            for (let i = 0; i < 8; i++) {
                await page1.waitForTimeout(300);
                await captureScreen();
            }
        }

        const targetGifPath = path.join(mediaDir, 'multiplayer_demo.gif');
        await createGifFromScreenshots(screenshots, targetGifPath, 30);

        await context1.close();
        await context2.close();
    });

});
