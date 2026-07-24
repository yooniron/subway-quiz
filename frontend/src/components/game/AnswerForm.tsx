import React from 'react';
import { Send } from 'lucide-react';

interface AnswerFormProps {
    userInput: string;
    // 표준 명칭 및 구버전 명칭 이중 듀얼 지원 (Universal Fallback)
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit?: (e: React.FormEvent) => void;
    onAnswerSubmit?: (e: React.FormEvent) => void;
    disabled?: boolean;
    isShaking?: boolean;
    isInputShaking?: boolean;
    placeholder?: string;
    inputRef: React.RefObject<HTMLInputElement>;
    colorCode?: string;
}

export const AnswerForm: React.FC<AnswerFormProps> = ({
    userInput,
    onChange,
    onInputChange,
    onSubmit,
    onAnswerSubmit,
    disabled = false,
    isShaking = false,
    isInputShaking = false,
    placeholder = "정답 역명을 입력하세요! 🎯",
    inputRef,
    colorCode
}) => {
    // 런타임 TypeError 100% 원천 방지 헬퍼
    const handleInputChange = onChange || onInputChange || (() => {});
    const handleFormSubmit = onSubmit || onAnswerSubmit || ((e: React.FormEvent) => e.preventDefault());
    const activeShaking = isShaking || isInputShaking;

    return (
        <form 
            onSubmit={handleFormSubmit} 
            className="flex gap-2 w-full max-w-sm sm:max-w-md mx-auto relative mt-2 sm:mt-4 pointer-events-auto"
        >
            <input
                ref={inputRef}
                autoFocus
                type="text"
                inputMode="text"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                readOnly={disabled}
                value={userInput}
                onChange={handleInputChange}
                onInput={(e: any) => handleInputChange(e)}
                placeholder={placeholder}
                style={colorCode && userInput.trim() !== '' ? { borderColor: colorCode, boxShadow: `0 0 20px ${colorCode}40` } : undefined}
                className={`flex-1 px-4 sm:px-5 py-3 sm:py-3.5 min-h-[48px] rounded-2xl bg-gray-950 border-2 border-gray-800 text-white text-base sm:text-lg font-bold placeholder:text-gray-600 focus:outline-none focus:border-emerald-400 focus:shadow-[0_0_20px_rgba(52,211,153,0.3)] transition-all duration-300 ${
                    disabled ? 'opacity-60 cursor-not-allowed bg-gray-900' : ''
                } ${
                    activeShaking ? 'animate-shake border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] text-red-400' : ''
                }`}
            />
            <button 
                type="submit"
                disabled={disabled}
                style={colorCode ? { backgroundColor: colorCode } : undefined}
                className="px-5 sm:px-6 py-3 sm:py-3.5 min-h-[48px] bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-2xl transition-all transform active:scale-95 shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Send className="w-5 h-5"/>
            </button>
        </form>
    );
};
