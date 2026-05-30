interface ProgressBarProps {
  current: number;
  total: number;
  showPercentage?: boolean;
}

export function ProgressBar({ current, total, showPercentage = true }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm font-mono mb-2">
        <span className="text-slate-400">
          {current} / {total}
        </span>
        {showPercentage && (
          <span className="text-cyan-400 font-semibold">{percentage}%</span>
        )}
      </div>
      <div className="relative w-full h-2.5 bg-slate-800/50 border border-cyan-500/20 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
