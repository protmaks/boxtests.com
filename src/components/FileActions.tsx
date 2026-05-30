import { useRef, useState, type ReactNode } from 'react';
import { useDuckDB } from '../context/DuckDBContext';
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
  children?: ReactNode;
}

export function FileActions({ onImportSuccess, children }: FileActionsProps) {
  const { importFromFile, exportToBlob, isLoading, run, query } = useDuckDB();
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
      } else {
        await importFromFile(file);
      }
      onImportSuccess?.();
    } catch (err) {
      console.error('Import failed:', err);
      alert('Failed to import file: ' + (err instanceof Error ? err.message : String(err)));
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

    alert(`Successfully imported ${data.tests.length} test(s)!`);
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
    <>
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".duckdb,.json"
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
        <button
          onClick={() => setShowExportModal(true)}
          disabled={isLoading}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:shadow-[0_0_15px_rgba(14,165,233,0.4)] disabled:opacity-50 transition-all font-medium"
        >
          Export
        </button>
        <a
          href="https://www.linkedin.com/in/protmaks/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center"
          title="LinkedIn Profile"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </a>
      </div>
      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />
    </>
  );
}
