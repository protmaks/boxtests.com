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
    let baseClass =
      'w-full text-left p-4 rounded-lg border-2 transition-all flex items-start gap-3';

    if (disabled && showCorrect) {
      if (option.is_correct) {
        baseClass += ' border-green-500 bg-green-50 dark:bg-green-900/20';
      } else if (isSelected && !option.is_correct) {
        baseClass += ' border-red-500 bg-red-50 dark:bg-red-900/20';
      } else {
        baseClass += ' border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800';
      }
    } else if (isSelected) {
      baseClass += ' border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20';
    } else {
      baseClass +=
        ' border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:bg-gray-50 dark:hover:bg-gray-700';
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
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              selectedOptions.includes(option.option_letter)
                ? 'border-indigo-500 bg-indigo-500 text-white'
                : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            {isMultiple ? (
              selectedOptions.includes(option.option_letter) && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )
            ) : (
              <span className="text-xs font-medium">
                {option.option_letter.toUpperCase()}
              </span>
            )}
          </span>
          <span
            className="flex-1 text-gray-900 dark:text-gray-100"
            dangerouslySetInnerHTML={{ __html: option.option_text }}
          />
          {showCorrect && option.is_correct && (
            <span className="text-green-600 dark:text-green-400 text-sm">✓ Правильный</span>
          )}
        </button>
      ))}

      {showDontKnow && onDontKnow && (
        <button
          type="button"
          onClick={onDontKnow}
          disabled={disabled}
          className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
            isDontKnowSelected
              ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-yellow-300'
          } ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <span className="w-6 h-6 rounded-full border-2 border-yellow-500 flex items-center justify-center flex-shrink-0">
            ?
          </span>
          <span className="text-gray-600 dark:text-gray-400">Не знаю</span>
        </button>
      )}
    </div>
  );
}
