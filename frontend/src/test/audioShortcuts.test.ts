import { describe, it, expect } from 'vitest';
import { 
    getIsSoundEnabled, 
    setSoundEnabled, 
    toggleSoundEnabled,
    playSubwayArrivalChime,
    playTickingClockSound,
    playDoorWarningSound 
} from '../lib/sound';

describe('Subway Audio SFX & Keyboard Shortcuts Tests', () => {
    it('should manage sound enabled toggle state correctly', () => {
        setSoundEnabled(true);
        expect(getIsSoundEnabled()).toBe(true);

        const nextState = toggleSoundEnabled();
        expect(nextState).toBe(false);
        expect(getIsSoundEnabled()).toBe(false);

        setSoundEnabled(true);
    });

    it('should invoke new audio SFX functions safely without throwing exceptions', () => {
        expect(() => playSubwayArrivalChime()).not.toThrow();
        expect(() => playTickingClockSound()).not.toThrow();
        expect(() => playDoorWarningSound()).not.toThrow();
    });
});
