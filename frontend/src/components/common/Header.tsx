import React from 'react';
import { Train } from 'lucide-react';

export const Header: React.FC = () => {
    return (
        <div className="flex items-center gap-3.5 mb-6 bg-gray-900/90 border border-gray-800 p-4 px-6 rounded-3xl shadow-2xl backdrop-blur-md">
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
    );
};
