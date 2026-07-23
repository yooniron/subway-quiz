import React, { useState } from 'react';
import { Lock, X, KeyRound } from 'lucide-react';

interface PasswordModalProps {
    isOpen: boolean;
    roomTitle: string;
    onClose: () => void;
    onConfirm: (password: string) => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
    isOpen,
    roomTitle,
    onClose,
    onConfirm
}) => {
    const [password, setPassword] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(password.trim());
        setPassword('');
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
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
                        <Lock className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-white">🔒 비공개방 입장 비밀번호</h3>
                        <p className="text-xs text-gray-400 line-clamp-1">{roomTitle}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1">
                            <KeyRound className="w-3.5 h-3.5 text-amber-400" /> 방 비밀번호 입력
                        </label>
                        <input
                            type="password"
                            autoFocus
                            maxLength={20}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="방 비밀번호를 입력해 주세요..."
                            className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-rose-400 transition-colors"
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
                            className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-500/20 transition-transform active:scale-98"
                        >
                            입장하기 ⚔️
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
