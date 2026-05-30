import type { QuestionOption } from '../types/quiz';

interface OptionListProps {
  options: QuestionOption[];
  selectedOptions: string[];
  onSelect: (optionLetter: string) => void;
  isMultiple: boolean;
  disabled?: boolean;
  showCorrect?: boolean;
  showDontKnow?: boolean;
  onDontKnow?: () => void;
  isDontKnowSelected?: boolean;
}

export function OptionList({
  options,
  selectedOptions,
  onSelect,
  isMultiple,
  disabled = false,
  showCorrect = false,
  showDontKnow = true,
  onDontKnow,
  isDontKnowSelected = false,
}: OptionListProps) {
  const getOptionClass = (option: QuestionOption) => {
    const isSelected = selectedOptions.includes(option.option_letter);
    const isCorrect = option.is_correct === true || option.is_correct === 'true';
    let baseClass =
      'w-full text-left p-4 rounded-xl border-2 transition-all duration-300 flex items-start gap-3 backdrop-blur-sm';

    if (disabled && showCorrect) {
      if (isCorrect) {
        baseClass += ' border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]';
      } else if (isSelected && !isCorrect) {
        baseClass += ' border-rose-500/50 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.2)]';
      } else {
        baseClass += ' border-gray-300 dark:border-slate-700/50 bg-gray-50 dark:bg-slate-800/30';
      }
    } else if (isSelected) {
      baseClass += ' border-blue-500/60 dark:border-cyan-500/60 bg-blue-500/10 dark:bg-cyan-500/10 shadow-lg';
    } else {
      baseClass +=
        ' border-gray-300 dark:border-slate-700/50 bg-white dark:bg-slate-800/20 hover:border-blue-500/40 dark:hover:border-cyan-500/40 hover:bg-gray-50 dark:hover:bg-slate-800/40 hover:shadow-md';
    }

    if (disabled) {
      baseClass += ' cursor-default';
    } else {
      baseClass += ' cursor-pointer';
    }

    return baseClass;
  };

  return (
    <div className="space-y-3">
      {options.map((option) => (
        <button
          key={option.option_letter}
          type="button"
          onClick={() => !disabled && onSelect(option.option_letter)}
          disabled={disabled}
          className={getOptionClass(option)}
        >
          <span
            className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center flex-shrink-0 font-mono font-bold transition-all ${
              selectedOptions.includes(option.option_letter)
                ? 'border-blue-500 dark:border-cyan-500 bg-gradient-to-br from-blue-500 to-cyan-500 dark:from-cyan-500 dark:to-blue-500 text-white shadow-lg'
                : 'border-gray-400 dark:border-slate-600 bg-gray-100 dark:bg-slate-800/50 text-gray-700 dark:text-slate-400'
            }`}
          >
            {isMultiple ? (
              selectedOptions.includes(option.option_letter) && (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )
            ) : (
              <span className="text-sm">
                {option.option_letter.toUpperCase()}
              </span>
            )}
          </span>
          <span
            className="flex-1 text-gray-900 dark:text-slate-200 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: option.option_text }}
          />
          {showCorrect && (option.is_correct === true || option.is_correct === 'true') && (
            <span className="text-emerald-400 text-sm font-mono font-semibold flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              CORRECT
            </span>
          )}
        </button>
      ))}

      {showDontKnow && onDontKnow && (
        <button
          type="button"
          onClick={onDontKnow}
          disabled={disabled}
          className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 flex items-center gap-3 backdrop-blur-sm ${
            isDontKnowSelected
              ? 'border-amber-500/60 bg-amber-500/10 shadow-lg'
              : 'border-gray-300 dark:border-slate-700/50 bg-white dark:bg-slate-800/20 hover:border-amber-500/40 hover:bg-gray-50 dark:hover:bg-slate-800/40 hover:shadow-md'
          } ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <span className="w-8 h-8 rounded-lg border-2 border-amber-500 dark:border-amber-500 bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0 font-mono font-bold text-amber-600 dark:text-amber-400">
            ?
          </span>
          <span className="text-gray-900 dark:text-slate-400 font-medium">Don't know / Skip</span>
        </button>
      )}
    </div>
  );
}
