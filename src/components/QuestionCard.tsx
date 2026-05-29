interface QuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  questionText: string;
  children: React.ReactNode;
}

export function QuestionCard({
  questionNumber,
  totalQuestions,
  questionText,
  children,
}: QuestionCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
        <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded">
          Вопрос {questionNumber} / {totalQuestions}
        </span>
      </div>
      <div
        className="prose dark:prose-invert max-w-none mb-6 text-gray-900 dark:text-gray-100"
        dangerouslySetInnerHTML={{ __html: questionText }}
      />
      {children}
    </div>
  );
}
