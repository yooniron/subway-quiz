import React from 'react';
import { Send } from 'lucide-react';

interface AnswerFormProps {
    userInput: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    disabled?: boolean;
    isShaking?: boolean;
    placeholder?: string;
    inputRef: React.RefObject<HTMLInputElement>;
}

export const AnswerForm: React.FC<AnswerFormProps> = ({
    userInput,
    onChange,
    onSubmit,
    disabled = false,
    isShaking = false,
    placeholder = "정답 역명을 입력하세요! 🎯",
    inputRef
}) => {
    return (
        <form 
            onSubmit={onSubmit} 
            className="flex gap-2 w-full max-w-sm sm:max-w-md mx-auto relative mt-2 sm:mt-4"
            onClick={() => inputRef.current?.focus()}
            onTouchStart={() => inputRef.current?.focus()}
        >
            <input
                ref={inputRef}
                autoFocus
                type="text"
                inputMode="text"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                disabled={disabled}
                value={userInput}
                onChange={onChange}
                placeholder={placeholder}
                className={`flex-1 px-4 sm:px-5 py-3 sm:py-3.5 min-h-[48px] rounded-2xl bg-gray-950 border-2 border-gray-800 text-white text-base sm:text-lg font-bold placeholder:text-gray-600 focus:outline-none focus:border-emerald-400 focus:shadow-[0_0_20px_rgba(52,211,153,0.3)] transition-all duration-300 ${
                    isShaking ? 'animate-shake border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] text-red-400' : ''
                }`}
            />
            <button 
                type="submit"
                disabled={disabled}
                className="px-5 sm:px-6 py-3 sm:py-3.5 min-h-[48px] bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-2xl transition-all transform active:scale-95 shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Send className="w-5 h-5"/>
            </button>
        </form>
    );
};
