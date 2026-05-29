import { useRef } from 'react';
import { useDuckDB } from '../context/DuckDBContext';

interface FileActionsProps {
  onImportSuccess?: () => void;
}

export function FileActions({ onImportSuccess }: FileActionsProps) {
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
      alert('Не удалось импортировать файл');
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
      alert('Не удалось экспортировать файл');
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
        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      >
        📂 Открыть .duckdb
      </label>
      <button
        onClick={handleExport}
        disabled={isLoading}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        💾 Сохранить
        {hasUnsavedChanges && <span className="ml-1 text-yellow-300">*</span>}
      </button>
    </div>
  );
}
