import React from 'react';
import { Train } from 'lucide-react';

export const Header: React.FC = () => {
    return (
        <div className="flex items-center gap-3 mb-6 bg-gray-900/90 border border-gray-800 p-3.5 px-5 rounded-3xl shadow-xl backdrop-blur-md">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-gray-950 flex items-center justify-center font-black text-lg shadow-lg shadow-emerald-500/20 border border-emerald-300/40">
                S
            </div>
            <div className="text-left">
                <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                    Subway Quiz <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/30 font-black tracking-wider">승강장 LIVE</span>
                </h1>
                <p className="text-xs text-gray-400 font-medium">서울 지하철 전동차 차내 LCD & 실시간 노선 퀴즈</p>
            </div>
        </div>
    );
};
