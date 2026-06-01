import { useRef, useState } from 'react';
import { useDuckDB } from '../context/DuckDBContext';
import { useNotification } from '../context/NotificationContext';
import { ExportModal } from './ExportModal';

interface ExportedData {
  version: number;
  exported_at: string;
  test_groups: Record<string, unknown>[];
  test_subgroups: Record<string, unknown>[];
  difficulty_levels: Record<string, unknown>[];
  tests: Record<string, unknown>[];
  questions: Record<string, unknown>[];
}

interface FileActionsProps {
  onImportSuccess?: () => void;
}

export function FileActions({ onImportSuccess }: FileActionsProps) {
  const { importFromFile, exportToBlob, isLoading, run, query } = useDuckDB();
  const { showNotification, showConfirm } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const escapeSQL = (val: unknown): string => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    if (typeof val === 'number') return String(val);
    return `'${String(val).replace(/'/g, "''")}'`;
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.name.endsWith('.json')) {
        await handleJSONImport(file);
      } else if (file.name.endsWith('.duckdb')) {
        // Validate DuckDB file before attempting import
        await validateAndImportDuckDB(file);
      } else {
        throw new Error('Unsupported file format. Please use .json or .duckdb files.');
      }
      onImportSuccess?.();
    } catch (err) {
      console.error('Import failed:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      // Provide more helpful error messages
      if (errorMessage.includes('not a valid DuckDB database')) {
        showNotification(
          'error',
          'Import Failed: Invalid Database File',
          'The selected file cannot be opened as a DuckDB database.\n\n' +
          'Common causes:\n' +
          '• File contains tests with images (not supported in .duckdb)\n' +
          '• File was created on a different device/browser\n' +
          '• File is corrupted or incomplete\n\n' +
          'SOLUTION: Use "Export" button instead\n' +
          '• Creates portable JSON files\n' +
          '• Works perfectly with images\n' +
          '• Compatible across all devices',
          8000
        );
      } else if (errorMessage.includes('Invalid export file format')) {
        showNotification(
          'error',
          'Import Failed: Invalid JSON Format',
          'The selected JSON file is not in the correct format.\n\n' +
          'Please use a JSON file created by this app\'s "Export" feature.',
          6000
        );
      } else if (errorMessage.includes('empty')) {
        showNotification('error', 'Import Failed', 'The selected file is empty.', 4000);
      } else {
        showNotification('error', 'Import Failed', errorMessage, 6000);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateAndImportDuckDB = async (file: File) => {
    // Check for empty file
    if (file.size === 0) {
      throw new Error('File is empty. Please select a valid database file.');
    }

    // Attempt import - DuckDB will validate the file format
    try {
      await importFromFile(file);
    } catch (err) {
      // Re-throw with more context
      const errorMsg = err instanceof Error ? err.message : String(err);
      
      // Provide helpful error message
      if (errorMsg.includes('not a valid DuckDB database')) {
        throw new Error(
          'The file is not a valid DuckDB database. ' +
          'Please use a file saved from this app, or export to JSON instead.'
        );
      }
      
      throw new Error(errorMsg);
    }
  };

  const handleJSONImport = async (file: File) => {
    const text = await file.text();
    const data: ExportedData = JSON.parse(text);

    if (!data.version || !data.tests || !data.questions) {
      throw new Error('Invalid export file format');
    }

    // Import groups (skip if already exists)
    for (const g of data.test_groups || []) {
      const existing = await query<{ id: number }>(`SELECT id FROM test_groups WHERE id = ${g.id}`);
      if (existing.length === 0) {
        await run(`
          INSERT INTO test_groups (id, name, description, color)
          VALUES (${escapeSQL(g.id)}, ${escapeSQL(g.name)}, ${escapeSQL(g.description)}, ${escapeSQL(g.color)})
        `);
      }
    }

    // Import subgroups (skip if already exists)
    for (const s of data.test_subgroups || []) {
      const existing = await query<{ id: number }>(`SELECT id FROM test_subgroups WHERE id = ${s.id}`);
      if (existing.length === 0) {
        await run(`
          INSERT INTO test_subgroups (id, name, group_id, description, color)
          VALUES (${escapeSQL(s.id)}, ${escapeSQL(s.name)}, ${escapeSQL(s.group_id)}, ${escapeSQL(s.description)}, ${escapeSQL(s.color)})
        `);
      }
    }

    // Import difficulty levels (skip if already exists)
    for (const d of data.difficulty_levels || []) {
      const existing = await query<{ id: number }>(`SELECT id FROM difficulty_levels WHERE id = ${d.id}`);
      if (existing.length === 0) {
        await run(`
          INSERT INTO difficulty_levels (id, name, color, description, group_id)
          VALUES (${escapeSQL(d.id)}, ${escapeSQL(d.name)}, ${escapeSQL(d.color)}, ${escapeSQL(d.description)}, ${escapeSQL(d.group_id)})
        `);
      }
    }

    // Import tests - generate new IDs to avoid conflicts
    const testIdMap = new Map<number, number>();
    for (const t of data.tests) {
      const oldId = t.test_id as number;
      
      // Get max test_id
      const maxResult = await query<{ max_id: number | null }>(`SELECT MAX(test_id) as max_id FROM tests`);
      const newId = (maxResult[0]?.max_id || 0) + 1;
      testIdMap.set(oldId, newId);

      await run(`
        INSERT INTO tests (test_id, display_name, group_id, subgroup_id, tags, difficulty_level_id, description)
        VALUES (${newId}, ${escapeSQL(t.display_name)}, ${escapeSQL(t.group_id)}, ${escapeSQL(t.subgroup_id)}, ${escapeSQL(t.tags)}, ${escapeSQL(t.difficulty_level_id)}, ${escapeSQL(t.description)})
      `);
    }

    // Import questions with new test_ids
    for (const q of data.questions) {
      const oldTestId = q.test_id as number;
      const newTestId = testIdMap.get(oldTestId);
      if (!newTestId) continue;

      await run(`
        INSERT INTO questions (id, question_text, id_var, options, correct_answer, test_id, explanation)
        VALUES (${escapeSQL(q.id)}, ${escapeSQL(q.question_text)}, ${escapeSQL(q.id_var)}, ${escapeSQL(q.options)}, ${escapeSQL(q.correct_answer)}, ${newTestId}, ${escapeSQL(q.explanation)})
      `);
    }

    showNotification('success', 'Import Successful!', `Successfully imported ${data.tests.length} test(s)!`, 4000);
  };

  const handleExport = async () => {
    try {
      // Check if database contains images
      const hasImages = await checkForImages();
      
      if (hasImages) {
        showConfirm({
          title: 'Warning: Your tests contain images!',
          message: 
            'The .duckdb file may not work reliably with images.\n\n' +
            'RECOMMENDED: Use "Export" button instead\n' +
            '   • Select tests and export as JSON\n' +
            '   • JSON format works perfectly with images\n' +
            '   • More reliable for backup and sharing\n\n' +
            'Do you still want to save as .duckdb?',
          type: 'warning',
          confirmText: 'Continue with .duckdb',
          cancelText: 'Use Export Instead',
          onConfirm: async () => {
            await performExport();
          },
          onCancel: () => {
            setShowExportModal(true);
          },
        });
        return;
      }
      
      await performExport();
    } catch (err) {
      console.error('Export failed:', err);
      
      const errorMessage = err instanceof Error ? err.message : String(err);
      let userMessage = 'Failed to save database:\n\n' + errorMessage;
      
      // Add context-specific help
      if (!errorMessage.includes('Try:')) {
        userMessage += '\n\nRecommendations:\n';
        
        if (errorMessage.includes('empty')) {
          userMessage += '• Database file is empty\n';
          userMessage += '• Try refreshing the page and creating a test again\n';
        }
        
        if (errorMessage.includes('locked') || errorMessage.includes('checkpoint')) {
          userMessage += '• Database is busy or locked\n';
          userMessage += '• Wait a few seconds and try again\n';
        }
        
        userMessage += '• Use "Export" button → JSON format instead\n';
        userMessage += '• JSON export is more reliable and portable';
      }
      
      showNotification('error', 'Export Failed', userMessage, 8000);
    }
  };

  const performExport = async () => {
    const blob = await exportToBlob();
    
    // Validate blob size
    if (blob.size === 0) {
      throw new Error('Failed to create database file (empty file)');
    }
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pm_tester_${new Date().toISOString().split('T')[0]}.duckdb`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('success', 'Database Saved!', `File size: ${Math.round(blob.size / 1024)}KB`, 4000);
  };

  const checkForImages = async (): Promise<boolean> => {
    try {
      // Check if any question_text contains Base64 image data
      const result = await query<{ has_images: number }>(`
        SELECT COUNT(*) as has_images 
        FROM questions 
        WHERE question_text LIKE '%data:image/%' 
        OR question_text LIKE '%<img%'
      `);
      return (result[0]?.has_images || 0) > 0;
    } catch {
      return false;
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
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
          className="px-2.5 sm:px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all font-medium text-xs sm:text-sm whitespace-nowrap"
          title="Open existing database (.duckdb) or import from JSON export"
        >
          Open
        </label>
        <button
          onClick={handleExport}
          disabled={isLoading}
          className="px-2.5 sm:px-3 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-all font-medium text-xs sm:text-sm whitespace-nowrap"
          title="Save entire database as .duckdb file (includes all tests, questions, and data)"
        >
          Save
        </button>
        <button
          onClick={() => setShowExportModal(true)}
          disabled={isLoading}
          className="px-2.5 sm:px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded hover:shadow-[0_0_15px_rgba(14,165,233,0.4)] disabled:opacity-50 transition-all font-medium text-xs sm:text-sm whitespace-nowrap"
          title="Export selected tests to JSON or TXT (portable format for sharing)"
        >
          Export
        </button>
      </div>
      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />
    </>
  );
}
