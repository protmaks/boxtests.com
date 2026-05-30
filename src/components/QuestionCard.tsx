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
    <div className="relative bg-white dark:bg-slate-800/40 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-cyan-500/20 shadow-lg p-8 hover:border-gray-300 dark:hover:border-cyan-500/40 transition-all duration-300 group">
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/5 dark:from-cyan-500/10 to-transparent rounded-bl-3xl"></div>
      
      <div className="flex items-center gap-3 text-sm mb-6">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-cyan-500/20 dark:to-blue-500/20 border border-blue-500/30 dark:border-cyan-500/30 rounded-lg font-mono">
          <div className="w-1.5 h-1.5 bg-blue-500 dark:bg-cyan-400 rounded-full animate-pulse"></div>
          <span className="text-blue-600 dark:text-cyan-400 font-semibold">
            Q{questionNumber}
          </span>
          <span className="text-gray-400 dark:text-slate-500">/</span>
          <span className="text-gray-600 dark:text-slate-400">{totalQuestions}</span>
        </div>
      </div>
      
      <div
        className="prose dark:prose-invert prose-cyan max-w-none mb-6 text-gray-900 dark:text-slate-200 text-lg leading-relaxed"
        dangerouslySetInnerHTML={{ __html: questionText }}
      />
      
      {children}
    </div>
  );
}
