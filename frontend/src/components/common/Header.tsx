import React, { useState } from 'react';
import { Train, Volume2, VolumeX } from 'lucide-react';
import { getIsSoundEnabled, toggleSoundEnabled, playClickSound } from '../../lib/sound';

export const Header: React.FC = () => {
    const [soundOn, setSoundOn] = useState<boolean>(() => getIsSoundEnabled());

    const handleToggleSound = () => {
        const next = toggleSoundEnabled();
        setSoundOn(next);
        if (next) {
            playClickSound();
        }
    };

    return (
        <div className="flex items-center justify-between gap-3.5 mb-6 bg-gray-900/90 border border-gray-800 p-4 px-6 rounded-3xl shadow-2xl backdrop-blur-md w-full max-w-md">
            <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-gradient-to-tr from-yellow-400 to-amber-500 text-gray-950 shadow-lg shadow-yellow-400/25 border border-yellow-300/40">
                    <Train className="w-7 h-7" />
                </div>
                <div className="text-left">
                    <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                        Subway Quiz <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 font-black tracking-wider">승강장 LIVE</span>
                    </h1>
                    <p className="text-xs text-gray-400 font-medium">실시간 지하철 노선 네트워크 퀴즈 게임</p>
                </div>
            </div>

            {/* 🔊 / 🔇 사운드 토글 버튼 */}
            <button
                onClick={handleToggleSound}
                className={`p-2.5 rounded-2xl border transition-all active:scale-95 flex items-center justify-center ${
                    soundOn 
                        ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/20' 
                        : 'bg-gray-800/80 border-gray-700 text-gray-500 hover:text-gray-300'
                }`}
                title={soundOn ? "사운드 켜짐 (음소거하기)" : "사운드 끔 (켜기)"}
            >
                {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
        </div>
    );
};
