interface QuestionStatus {
  isCorrect: boolean | null;
  selectedOptions: string[];
}

interface QuestionNavProps {
  total: number;
  currentIndex: number;
  answerStates: Map<number, QuestionStatus>;
  onSelect: (index: number) => void;
}

export function QuestionNav({ total, currentIndex, answerStates, onSelect }: QuestionNavProps) {
  const getStatusClass = (index: number) => {
    const answer = answerStates.get(index);
    if (!answer) {
      // Unanswered
      return 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600';
    }
    if (answer.selectedOptions.length === 0) {
      // Don't know
      return 'bg-yellow-400 dark:bg-yellow-600 text-white hover:bg-yellow-500 dark:hover:bg-yellow-500';
    }
    if (answer.isCorrect === true) {
      // Correct
      return 'bg-green-500 dark:bg-green-600 text-white hover:bg-green-600 dark:hover:bg-green-500';
    }
    // Incorrect
    return 'bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-500';
  };

  return (
    <div className="flex flex-wrap gap-1.5 justify-center mt-6 mb-3">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={`
            w-8 h-8 rounded-md text-sm font-medium transition-all
            ${getStatusClass(i)}
            ${i === currentIndex ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-900' : ''}
          `}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
}
