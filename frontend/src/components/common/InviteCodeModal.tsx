import React, { useState } from 'react';
import { Key, X, Ticket } from 'lucide-react';

interface InviteCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onJoinByCode: (code: string) => void;
}

export const InviteCodeModal: React.FC<InviteCodeModalProps> = ({
    isOpen,
    onClose,
    onJoinByCode
}) => {
    const [code, setCode] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanCode = code.trim().toUpperCase();
        if (cleanCode.length < 4) return;
        onJoinByCode(cleanCode);
        setCode('');
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-950/85 backdrop-blur-md px-4 animate-fade-in">
            <div className="relative w-full max-w-sm bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl animate-card-pop">
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-gray-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner">
                        <Key className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-white">🔑 초대 코드로 직통 입장</h3>
                        <p className="text-xs text-gray-400">전달받은 6자리 대전방 초대 코드를 입력하세요</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1">
                            <Ticket className="w-3.5 h-3.5 text-amber-400" /> 6자리 초대 코드
                        </label>
                        <input
                            type="text"
                            autoFocus
                            maxLength={10}
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="예: A8K9F2"
                            className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-center text-lg font-black font-mono tracking-widest text-amber-400 placeholder-gray-700 focus:outline-none focus:border-amber-400 transition-colors uppercase"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-gray-950 hover:bg-gray-800 text-gray-400 font-bold text-xs rounded-xl border border-gray-800 transition-colors"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={code.trim().length < 4}
                            className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 disabled:opacity-50 text-gray-950 font-black text-xs rounded-xl shadow-lg shadow-amber-400/20 transition-transform active:scale-98"
                        >
                            방 찾아 입장 🚀
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
