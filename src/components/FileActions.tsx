import { useRef, ReactNode } from 'react';
import { useDuckDB } from '../context/DuckDBContext';

interface FileActionsProps {
  onImportSuccess?: () => void;
  children?: ReactNode;
}

export function FileActions({ onImportSuccess, children }: FileActionsProps) {
  const { importFromFile, exportToBlob, isLoading, hasUnsavedChanges } = useDuckDB();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await importFromFile(file);
      onImportSuccess?.();
    } catch (err) {
      console.error('Import failed:', err);
      alert('Failed to import file');
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
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export file');
    }
  };

  return (
    <div className="flex gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".duckdb"
        onChange={handleImport}
        className="hidden"
        id="db-file-input"
      />
      <label
        htmlFor="db-file-input"
        className="px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all font-medium"
      >
        Open
      </label>
      {children}
      <button
        onClick={handleExport}
        disabled={isLoading}
        className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-all font-medium"
      >
        Save
      </button>
    </div>
  );
}
