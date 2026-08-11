import React, { useState } from 'react';
import { X, Lock, User, Sparkles, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { loginUser, registerUser } from '../../utils/auth';
import type { AuthUser } from '../../types/auth';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (user: AuthUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
    isOpen,
    onClose,
    onSuccess
}) => {
    const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState(() => localStorage.getItem('subway_nickname') || '');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);
        setIsLoading(true);

        try {
            if (mode === 'LOGIN') {
                const res = await loginUser(username, password);
                if (res.success && res.user) {
                    setSuccessMessage(`반갑습니다, ${res.user.nickname}님! 30종 업적과 칭호가 동기화되었습니다.`);
                    setTimeout(() => {
                        onSuccess(res.user!);
                        onClose();
                    }, 600);
                } else {
                    setErrorMessage(res.errorMessage || '로그인에 실패했습니다.');
                }
            } else {
                const res = await registerUser(username, password, nickname);
                if (res.success && res.user) {
                    setSuccessMessage(`회원가입 완료! 이제 어느 기기에서나 내 기록이 보존됩니다.`);
                    setTimeout(() => {
                        onSuccess(res.user!);
                        onClose();
                    }, 600);
                } else {
                    setErrorMessage(res.errorMessage || '회원가입에 실패했습니다.');
                }
            }
        } catch (e: any) {
            setErrorMessage(e.message || '인증 처리 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="bg-gray-950 border-2 border-yellow-400/40 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-[0_0_50px_rgba(250,204,21,0.25)] relative overflow-hidden flex flex-col gap-4">
                
                {/* 상단 닫기 버튼 */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 p-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white transition-all cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* 헤더 & 아이콘 */}
                <div className="text-center pt-2">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-400/15 border border-yellow-400/40 flex items-center justify-center text-yellow-400 mx-auto mb-3 shadow-md">
                        <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                        {mode === 'LOGIN' ? '클라우드 계정 로그인' : '3초 초간편 계정 생성'}
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                        어느 기기에서든 30종 업적, 칭호, 랭킹을 영구 보존하세요!
                    </p>
                </div>

                {/* 탭 전환 버튼 */}
                <div className="grid grid-cols-2 p-1 bg-gray-900 rounded-2xl border border-gray-800">
                    <button
                        type="button"
                        onClick={() => { setMode('LOGIN'); setErrorMessage(null); }}
                        className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            mode === 'LOGIN'
                                ? 'bg-yellow-400 text-gray-950 shadow-md'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        로그인
                    </button>
                    <button
                        type="button"
                        onClick={() => { setMode('REGISTER'); setErrorMessage(null); }}
                        className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            mode === 'REGISTER'
                                ? 'bg-yellow-400 text-gray-950 shadow-md'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        3초 회원가입
                    </button>
                </div>

                {/* 에러 / 성공 알림 */}
                {errorMessage && (
                    <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-300 text-xs font-bold flex items-center gap-2 animate-shake">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                        <span>{errorMessage}</span>
                    </div>
                )}
                {successMessage && (
                    <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                        <span>{successMessage}</span>
                    </div>
                )}

                {/* 로그인 / 가입 폼 */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <div>
                        <label className="block text-[11px] font-bold text-gray-300 mb-1">
                            아이디 (영문/숫자 3자 이상)
                        </label>
                        <div className="relative">
                            <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="예: subway_master"
                                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400 transition-all font-mono"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-gray-300 mb-1">
                            비밀번호 (4자 이상)
                        </label>
                        <div className="relative">
                            <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400 transition-all"
                            />
                        </div>
                    </div>

                    {mode === 'REGISTER' && (
                        <div>
                            <label className="block text-[11px] font-bold text-gray-300 mb-1">
                                게임 내 닉네임
                            </label>
                            <input
                                type="text"
                                required
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                placeholder="표시될 닉네임 입력 (2자 이상)"
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400 transition-all"
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="mt-2 w-full py-3.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 disabled:opacity-50 text-gray-950 font-black text-sm rounded-xl shadow-lg shadow-yellow-400/20 transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>{mode === 'LOGIN' ? '로그인 및 데이터 동기화' : '3초 회원가입 완료'}</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                {/* 게스트 계속하기 & Zero-PII 안내 */}
                <div className="pt-2 border-t border-gray-800/80 flex flex-col gap-2.5 text-center">
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-xs text-gray-400 hover:text-gray-200 underline underline-offset-2 transition-all cursor-pointer"
                    >
                        👤 로그인 없이 게스트로 계속 플레이하기
                    </button>

                    <div className="p-2.5 bg-gray-900/60 border border-gray-800/60 rounded-xl flex items-start gap-2 text-left">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-gray-400 leading-tight">
                            <b>Zero-PII 안심 보장</b>: 본 서비스는 이메일, 실명 등 개인정보를 일절 수집하지 않으며, 오직 게임 진행 데이터 보존 용도로만 사용됩니다.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
