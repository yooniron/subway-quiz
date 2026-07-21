import React from 'react';
import { Train } from 'lucide-react';

export const Header: React.FC = () => {
    return (
        <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-yellow-400 text-gray-950 shadow-lg shadow-yellow-400/20">
                <Train className="w-8 h-8" />
            </div>
            <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                    Subway Quiz <span className="text-xs px-2.5 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 font-bold">LIVE</span>
                </h1>
                <p className="text-xs text-gray-400 font-medium">수도권 지하철 노선망 네트워크 퀴즈</p>
            </div>
        </div>
    );
};
