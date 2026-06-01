import { DBStatus } from './DBStatus';
import { useDuckDB } from '../context/DuckDBContext';
import { useNotification } from '../context/NotificationContext';
import { useRef, useState } from 'react';
import { ExportModal } from './ExportModal';

export function BottomToolbar() {
  const { importFromFile, exportToBlob, isLoading, query } = useDuckDB();
  const { showNotification, showConfirm } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      await importFromFile(file);
      showNotification('success', 'Import Successful!', 'Database loaded successfully', 3000);
    } catch (err) {
      showNotification('error', 'Import Failed', err instanceof Error ? err.message : String(err), 5000);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportToBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pm_tester_${new Date().toISOString().split('T')[0]}.duckdb`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('success', 'Database Saved!', `File size: ${Math.round(blob.size / 1024)}KB`, 4000);
    } catch (err) {
      showNotification('error', 'Export Failed', err instanceof Error ? err.message : String(err), 5000);
    }
  };

  return (
    <div className="sticky top-[88px] z-40 bg-slate-800/90 backdrop-blur-xl border-b border-cyan-500/30 shadow-[0_0_20px_rgba(14,165,233,0.15)]">
      <div className="max-w-6xl mx-auto px-1 sm:px-4 py-0.5 sm:py-1">
        <div className="flex items-center justify-between gap-0.5 sm:gap-3 overflow-x-auto">
          {/* Left: Database status label + Open */}
          <div className="flex-shrink-0 flex items-center gap-0.5 sm:gap-1.5">
            <span className="text-[9px] sm:text-xs font-mono text-cyan-400/60 uppercase tracking-wider">
              <span className="hidden sm:inline">Database status:</span>
              <span className="sm:hidden">DB:</span>
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".duckdb,.json"
              onChange={handleImport}
              className="hidden"
              id="db-file-input"
              title="Import .duckdb database or .json export"
            />
            <label
              htmlFor="db-file-input"
              className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all font-medium text-[9px] sm:text-xs whitespace-nowrap"
              title="Open existing database (.duckdb) or import from JSON export"
            >
              Open
            </label>
          </div>
          
          {/* Center: DB Status */}
          <div className="flex-shrink flex justify-center min-w-0">
            <DBStatus />
          </div>
          
          {/* Right: Save, Export */}
          <div className="flex-shrink-0 flex items-center gap-0.5 sm:gap-1.5">
            <button
              onClick={handleExport}
              disabled={isLoading}
              className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-all font-medium text-[9px] sm:text-xs whitespace-nowrap"
              title="Save entire database as .duckdb file (includes all tests, questions, and data)"
            >
              Save
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              disabled={isLoading}
              className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded hover:shadow-[0_0_15px_rgba(14,165,233,0.4)] disabled:opacity-50 transition-all font-medium text-[9px] sm:text-xs whitespace-nowrap"
              title="Export selected tests to JSON or TXT (portable format for sharing)"
            >
              Export
            </button>
          </div>
        </div>
      </div>
      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />
    </div>
  );
}
