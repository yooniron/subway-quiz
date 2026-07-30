// Web Audio API 기반 순수 브라우저 합성 사운드 모듈 (외부 mp3 파일 의존 0%)

let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
};

// localStorage를 활용한 사운드 활성화 여부 관리 (기본값: true)
export const getIsSoundEnabled = (): boolean => {
    const saved = localStorage.getItem('subway_sound_enabled');
    return saved === null ? true : saved === 'true';
};

export const setSoundEnabled = (enabled: boolean): void => {
    localStorage.setItem('subway_sound_enabled', String(enabled));
};

export const toggleSoundEnabled = (): boolean => {
    const next = !getIsSoundEnabled();
    setSoundEnabled(next);
    return next;
};

// ⭕ 정답 차임벨 ("띵동댕♪" - G5 & C6 Sine wave)
export const playCorrectSound = (): void => {
    if (!getIsSoundEnabled()) return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        // 첫 번째 톤 (G5 = 783.99 Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(783.99, now);
        gain1.gain.setValueAtTime(0.15, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.25);

        // 두 번째 높은 톤 (C6 = 1046.50 Hz)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1046.50, now + 0.1);
        gain2.gain.setValueAtTime(0.2, now + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.45);
    } catch {
        /* ignore audio error */
    }
};

// ❌ 오답음 ("땡!" - Low Sawtooth Frequency Drop)
export const playWrongSound = (): void => {
    if (!getIsSoundEnabled()) return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
    } catch {
        /* ignore audio error */
    }
};

// 🔥 콤보 피버 상승음
export const playComboSound = (comboCount: number): void => {
    if (!getIsSoundEnabled()) return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        // 콤보 수에 따라 주파수 피치 톤 업 (기본 523.25 Hz C5 시작)
        const baseFreq = 523.25 * Math.pow(1.06, Math.min(comboCount, 15));

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.2);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
    } catch {
        /* ignore audio error */
    }
};

// 👑 승리 & 완파 팡파레 아르페지오 (C Major Arpeggio: C5 -> E5 -> G5 -> C6)
export const playVictorySound = (): void => {
    if (!getIsSoundEnabled()) return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50];

        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const noteTime = now + idx * 0.12;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, noteTime);
            gain.gain.setValueAtTime(0.2, noteTime);
            gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(noteTime);
            osc.stop(noteTime + 0.35);
        });
    } catch {
        /* ignore audio error */
    }
};

// 🔘 버튼 터치/클릭음
export const playClickSound = (): void => {
    if (!getIsSoundEnabled()) return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
    } catch {
        /* ignore audio error */
    }
};
