interface InstantStatsProps {
  correct: number;
  incorrect: number;
  dontKnow: number;
  unanswered: number;
}

export function InstantStats({ correct, incorrect, dontKnow, unanswered }: InstantStatsProps) {
  return (
    <div className="flex gap-3 text-sm font-mono">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg backdrop-blur-sm hover:border-emerald-500/50 transition-colors">
        <div className="text-emerald-400 font-bold text-base">{correct}</div>
        <div className="text-emerald-500/80 text-xs uppercase tracking-wider">Correct</div>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 rounded-lg backdrop-blur-sm hover:border-rose-500/50 transition-colors">
        <div className="text-rose-400 font-bold text-base">{incorrect}</div>
        <div className="text-rose-500/80 text-xs uppercase tracking-wider">Incorrect</div>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg backdrop-blur-sm hover:border-amber-500/50 transition-colors">
        <div className="text-amber-400 font-bold text-base">{dontKnow}</div>
        <div className="text-amber-500/80 text-xs uppercase tracking-wider">Unknown</div>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-500/10 border border-slate-500/30 rounded-lg backdrop-blur-sm hover:border-slate-500/50 transition-colors">
        <div className="text-slate-400 font-bold text-base">{unanswered}</div>
        <div className="text-slate-500/80 text-xs uppercase tracking-wider">Pending</div>
      </div>
    </div>
  );
}
