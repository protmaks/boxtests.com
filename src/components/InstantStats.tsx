interface InstantStatsProps {
  correct: number;
  incorrect: number;
  dontKnow: number;
  unanswered: number;
}

export function InstantStats({ correct, incorrect, dontKnow, unanswered }: InstantStatsProps) {
  return (
    <div className="flex gap-3 text-sm">
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 rounded">
        <div className="text-green-700 dark:text-green-400 font-bold">{correct}</div>
        <div className="text-green-600 dark:text-green-500 text-xs">Correct</div>
      </div>
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 dark:bg-red-900/30 rounded">
        <div className="text-red-700 dark:text-red-400 font-bold">{incorrect}</div>
        <div className="text-red-600 dark:text-red-500 text-xs">Incorrect</div>
      </div>
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded">
        <div className="text-yellow-700 dark:text-yellow-400 font-bold">{dontKnow}</div>
        <div className="text-yellow-600 dark:text-yellow-500 text-xs">Don't know</div>
      </div>
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-gray-700 rounded">
        <div className="text-gray-700 dark:text-gray-300 font-bold">{unanswered}</div>
        <div className="text-gray-600 dark:text-gray-400 text-xs">Unanswered</div>
      </div>
    </div>
  );
}
