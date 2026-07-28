import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface MultipleChoiceOptionsProps {
    options: string[];
    selectedOption: string | null;
    targetStationName: string;
    onSelectOption: (option: string) => void;
    disabled: boolean;
}

export const MultipleChoiceOptions: React.FC<MultipleChoiceOptionsProps> = ({
    options,
    selectedOption,
    targetStationName,
    onSelectOption,
    disabled
}) => {
    const targetClean = targetStationName.replace(/역$/, '').trim();

    return (
        <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 my-2">
            {options.map((option, idx) => {
                const cleanOpt = option.replace(/역$/, '').trim();
                const isSelected = selectedOption === option;
                const isCorrect = cleanOpt === targetClean;

                let cardStyle = "bg-gray-900/90 border-gray-800 text-gray-200 hover:bg-gray-800 hover:border-yellow-400/50 hover:text-white";
                let badgeIcon = null;

                if (isSelected) {
                    if (isCorrect) {
                        cardStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse";
                        badgeIcon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
                    } else {
                        cardStyle = "bg-rose-500/20 border-rose-500 text-rose-300 animate-shake";
                        badgeIcon = <XCircle className="w-5 h-5 text-rose-400 shrink-0" />;
                    }
                }

                return (
                    <button
                        key={idx}
                        disabled={disabled}
                        onClick={() => onSelectOption(option)}
                        className={`relative flex items-center justify-between p-4 rounded-2xl border-2 font-black text-base sm:text-lg transition-all active:scale-98 disabled:pointer-events-none shadow-lg ${cardStyle}`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-xl bg-gray-800 border border-gray-700 text-xs font-mono font-bold flex items-center justify-center text-yellow-400 shrink-0">
                                {idx + 1}
                            </span>
                            <span className="truncate">{cleanOpt}역</span>
                        </div>
                        {badgeIcon}
                    </button>
                );
            })}
        </div>
    );
};
