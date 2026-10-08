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
            className="flex gap-2.5 w-full max-w-sm sm:max-w-md mx-auto relative mt-3 sm:mt-5 pointer-events-auto"
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
                style={colorCode && userInput.trim() !== '' ? { borderColor: colorCode, boxShadow: `0 0 25px ${colorCode}50` } : undefined}
                className={`flex-1 px-4 sm:px-6 py-3.5 sm:py-4 min-h-[52px] rounded-2xl bg-gray-950/90 border-2 border-gray-700 text-white text-base sm:text-xl font-black placeholder:text-gray-500 focus:outline-none focus:border-yellow-400 focus:shadow-[0_0_25px_rgba(250,204,21,0.35)] [word-break:keep-all] break-keep transition-all duration-200 ${
                    disabled ? 'opacity-50 cursor-not-allowed bg-gray-900' : ''
                } ${
                    activeShaking ? 'animate-shake border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.5)] text-red-400' : ''
                }`}
            />
            <button 
                type="submit"
                disabled={disabled}
                style={colorCode ? { backgroundColor: colorCode } : undefined}
                className="px-6 sm:px-7 py-3.5 sm:py-4 min-h-[52px] bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-gray-950 font-black rounded-2xl transition-all transform shadow-xl shadow-yellow-400/20 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
                <Send className="w-5 h-5 stroke-[2.5] text-gray-950"/>
            </button>
        </form>
    );
};

