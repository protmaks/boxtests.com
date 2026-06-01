import { useDuckDB } from '../context/DuckDBContext';
import { useNotification } from '../context/NotificationContext';

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function DBStatus() {
  const { isLoading, error, isInitialized, cacheSize, clearCache, loadExampleDB } = useDuckDB();
  const { showNotification, showConfirm } = useNotification();

  const handleLoadExample = async () => {
    showConfirm({
      title: 'Load Example Database?',
      message: 
        'This will replace your current database with example data.\n\n' +
        'IMPORTANT: Make sure to export your tests first if you want to keep them:\n' +
        '   1. Click "Export" button\n' +
        '   2. Select all tests\n' +
        '   3. Download as JSON\n\n' +
        'Do you want to continue?',
      type: 'warning',
      confirmText: 'Load Example',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await loadExampleDB();
          showNotification(
            'success',
            'Example database loaded!',
            'The example database has been loaded. Reloading the page...',
            2000
          );
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } catch (err) {
          console.error('Failed to load example database:', err);
          showNotification(
            'error',
            'Failed to load example database',
            'Error: ' + (err instanceof Error ? err.message : String(err)) + '\n\nCheck the browser console for more details.',
            6000
          );
        }
      },
    });
  };

  const handleClearCache = async () => {
    showConfirm({
      title: 'Clear Database?',
      message: 
        'This will DELETE ALL your tests and data!\n\n' +
        'IMPORTANT: Make sure to export your tests first:\n' +
        '   1. Click "Export" button\n' +
        '   2. Select all tests\n' +
        '   3. Download as JSON\n\n' +
        'Use this to fix:\n' +
        '   • "Database corruption" errors\n' +
        '   • "Checksum" errors\n' +
        '   • "Memory access out of bounds" errors\n' +
        '   • Other database issues\n\n' +
        'Do you want to continue?',
      type: 'danger',
      confirmText: 'Clear Database',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await clearCache();
          showNotification(
            'success',
            'Database cleared!',
            'The database has been reset to initial state.\nYou can now:\n• Create new tests\n• Import from JSON files',
            5000
          );
        } catch (err) {
          console.error('Failed to clear cache:', err);
          showNotification(
            'error',
            'Failed to clear database',
            err instanceof Error ? err.message : String(err),
            6000
          );
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-mono text-cyan-400">
        <div className="relative w-2.5 sm:w-3 h-2.5 sm:h-3">
          <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-full"></div>
          <div className="absolute inset-0 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <span className="animate-pulse hidden sm:inline">Initializing DuckDB...</span>
        <span className="animate-pulse sm:hidden">Init...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-mono text-rose-400 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-rose-500/10 border border-rose-500/30 rounded">
        <svg className="w-2.5 sm:w-3 h-2.5 sm:h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="hidden sm:inline">DB Error: {error.message}</span>
        <span className="sm:hidden">Error</span>
      </div>
    );
  }

  if (isInitialized) {
    return (
      <div className="flex items-center gap-0.5 sm:gap-1.5">
        <div className="flex items-center gap-0.5 sm:gap-1.5 text-[9px] sm:text-xs font-mono px-1 sm:px-2 py-0.5 sm:py-1 bg-emerald-500/10 border border-emerald-500/30 rounded whitespace-nowrap">
          <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="text-emerald-400">DB</span>
          {cacheSize !== null &&(
            <span className="text-emerald-400/70 hidden sm:inline">({formatBytes(cacheSize)})</span>
          )}
        </div>
        <button
          onClick={handleLoadExample}
          className="text-[8px] sm:text-[10px] text-cyan-400 hover:text-cyan-300 underline font-mono px-0.5 sm:px-1 transition-colors"
          title="Load example database with sample data"
        >
          example
        </button>
        <button
          onClick={handleClearCache}
          className="group flex items-center justify-center gap-0.5 sm:gap-1 px-1 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-xs font-mono text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded hover:bg-rose-500/20 hover:border-rose-500/50 transition-all whitespace-nowrap min-w-[20px] sm:min-w-0"
          title="Clear all database data (use to fix corruption errors)"
        >
          <svg className="w-3 sm:w-3 h-3 sm:h-3 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    );
  }

  return null;
}
