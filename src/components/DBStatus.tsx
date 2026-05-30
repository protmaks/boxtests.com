import { useDuckDB } from '../context/DuckDBContext';

export function DBStatus() {
  const { isLoading, error, isInitialized } = useDuckDB();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm font-mono text-cyan-400">
        <div className="relative w-4 h-4">
          <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-full"></div>
          <div className="absolute inset-0 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <span className="animate-pulse">Initializing DuckDB...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm font-mono text-rose-400 px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 rounded-lg">
        <span className="text-lg">⚠</span>
        <span>DB Error: {error.message}</span>
      </div>
    );
  }

  if (isInitialized) {
    return (
      <div className="flex items-center gap-2 text-sm font-mono px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
        <span className="text-emerald-400">DuckDB Online</span>
      </div>
    );
  }

  return null;
}
