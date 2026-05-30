import { useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
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
  const [showHelpModal, setShowHelpModal] = useState(false);

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
        alert(
          '⚠️ Import Failed: Invalid Database File\n\n' +
          'The selected file cannot be opened as a DuckDB database.\n\n' +
          '💡 Common causes:\n' +
          '• File contains tests with images (not supported in .duckdb)\n' +
          '• File was created on a different device/browser\n' +
          '• File is corrupted or incomplete\n\n' +
          '✅ Solution: Use "Export" button instead\n' +
          '• Creates portable JSON files\n' +
          '• Works perfectly with images\n' +
          '• Compatible across all devices'
        );
      } else if (errorMessage.includes('Invalid export file format')) {
        alert(
          '⚠️ Import Failed: Invalid JSON Format\n\n' +
          'The selected JSON file is not in the correct format.\n\n' +
          'Please use a JSON file created by this app\'s "Export" feature.'
        );
      } else if (errorMessage.includes('empty')) {
        alert('⚠️ Import Failed: The selected file is empty.');
      } else {
        alert('⚠️ Import Failed\n\n' + errorMessage);
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

    alert(`Successfully imported ${data.tests.length} test(s)!`);
  };

  const handleExport = async () => {
    try {
      // Check if database contains images
      const hasImages = await checkForImages();
      
      if (hasImages) {
        const userConfirmed = confirm(
          '⚠️ Warning: Your tests contain images!\n\n' +
          'The .duckdb file may not work reliably with images.\n\n' +
          '✅ RECOMMENDED: Use "Export" button instead\n' +
          '   • Select tests and export as JSON\n   •• JSON format works perfectly with images\n' +
          '   • More reliable for backup and sharing\n\n' +
          'Do you still want to save as .duckdb?\n' +
          '(Click Cancel to use Export instead)'
        );
        
        if (!userConfirmed) {
          // User chose to use Export instead
          setShowExportModal(true);
          return;
        }
      }
      
      console.log('Starting database export...');
      const blob = await exportToBlob();
      
      // Validate blob size
      if (blob.size === 0) {
        throw new Error('Failed to create database file (empty file)');
      }
      
      console.log(`Database file created: ${Math.round(blob.size / 1024)}KB`);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pm_tester_${new Date().toISOString().split('T')[0]}.duckdb`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Database file downloaded successfully');
    } catch (err) {
      console.error('Export failed:', err);
      
      const errorMessage = err instanceof Error ? err.message : String(err);
      let userMessage = 'Failed to save database:\n\n' + errorMessage;
      
      // Add context-specific help
      if (!errorMessage.includes('💡')) {
        userMessage += '\n\n💡 Recommendations:\n';
        
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
      
      alert(userMessage);
    }
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
      <div className="flex gap-2">
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
          className="px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all font-medium"
          title="Open existing database (.duckdb) or import from JSON export"
        >
          Open
        </label>
        {children}
        <button
          onClick={handleExport}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-all font-medium"
          title="Save entire database as .duckdb file (includes all tests, questions, and data)"
        >
          Save
        </button>
        <button
          onClick={() => setShowExportModal(true)}
          disabled={isLoading}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:shadow-[0_0_15px_rgba(14,165,233,0.4)] disabled:opacity-50 transition-all font-medium"
          title="Export selected tests to JSON or TXT (portable format for sharing)"
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
        <button
          onClick={() => setShowHelpModal(true)}
          className="px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-cyan-400 dark:hover:text-cyan-400 transition-colors flex items-center"
          title="Help: File Import/Export Guide"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />
      
      {/* Help Modal */}
      {showHelpModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowHelpModal(false)}
          />
          <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(14,165,233,0.2)] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-slate-800/50">
              <h2 className="text-xl font-bold text-gradient">Import/Export Guide</h2>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-slate-300">
              {/* Open Button */}
              <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700 hover:border-cyan-500/30 transition-colors">
                <h3 className="text-base font-semibold text-cyan-400 mb-3 flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div>Open Button</div>
                    <div className="text-xs text-slate-500 font-normal">Import existing data</div>
                  </div>
                </h3>
                <ul className="text-sm space-y-2 ml-2">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span><strong className="text-slate-200">.json files</strong> — Import tests from Export (portable)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span><strong className="text-slate-200">.duckdb files</strong> — Open from Save (same device only)</span>
                  </li>
                </ul>
              </div>

              {/* Save Button */}
              <div className="bg-slate-800/40 rounded-lg p-4 border border-orange-500/40 hover:border-orange-500/60 transition-colors">
                <h3 className="text-base font-semibold text-orange-400 mb-3 flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                  </div>
                  <div>
                    <div>Save Button</div>
                    <div className="text-xs text-orange-500 font-normal">⚠️ Not Recommended</div>
                  </div>
                </h3>
                <ul className="text-sm space-y-2 ml-2">
                  <li className="flex items-start gap-2">
                    <span className="text-slate-500 mt-0.5">•</span>
                    <span>Complete backup with all data and statistics</span>
                  </li>
                  <li className="flex items-start gap-2 bg-orange-500/10 p-2 rounded">
                    <span className="text-orange-400 mt-0.5">⚠</span>
                    <span className="text-orange-300"><strong>Unreliable</strong> — .duckdb files often fail to import, even without images</span>
                  </li>
                  <li className="flex items-start gap-2 bg-orange-500/10 p-2 rounded">
                    <span className="text-orange-400 mt-0.5">⚠</span>
                    <span className="text-orange-300"><strong>Device-specific</strong> — may not work on other computers/browsers</span>
                  </li>
                  <li className="flex items-start gap-2 bg-orange-500/10 p-2 rounded">
                    <span className="text-orange-400 mt-0.5">⚠</span>
                    <span className="text-orange-300"><strong>Rich text issues</strong> — HTML formatting can cause corruption</span>
                  </li>
                </ul>
              </div>

              {/* Export Button */}
              <div className="bg-cyan-500/5 rounded-lg p-4 border border-cyan-500/40 hover:border-cyan-500/60 transition-colors shadow-[0_0_15px_rgba(14,165,233,0.1)]">
                <h3 className="text-base font-semibold text-cyan-400 mb-3 flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <div>Export Button</div>
                    <div className="text-xs text-cyan-500 font-normal">Recommended for sharing</div>
                  </div>
                </h3>
                <ul className="text-sm space-y-2 ml-2">
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Works across <strong className="text-white">ALL devices and browsers</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong className="text-cyan-400">Reliable with images</strong> — Base64 in HTML works perfectly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Select specific tests to export</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>JSON for import, TXT for printing</span>
                  </li>
                </ul>
              </div>

              {/* Best Practices */}
              <div className="bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-lg p-4 border border-cyan-500/30">
                <h3 className="text-base font-semibold text-cyan-400 mb-3 flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span>Best Practices</span>
                </h3>
                <div className="text-sm space-y-2 ml-2">
                  <div className="flex items-start gap-2 p-2 rounded bg-cyan-500/10 border border-cyan-500/30">
                    <span className="text-cyan-400 font-mono text-xs mt-0.5">✓</span>
                    <span><strong className="text-cyan-400">ALWAYS use Export → JSON</strong> for all backups and sharing</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded bg-slate-800/40">
                    <span className="text-cyan-400 font-mono text-xs mt-0.5">→</span>
                    <span><strong className="text-slate-200">Tests with images?</strong> Export → JSON (only reliable option)</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded bg-slate-800/40">
                    <span className="text-cyan-400 font-mono text-xs mt-0.5">→</span>
                    <span><strong className="text-slate-200">Tests with rich text?</strong> Export → JSON (avoids corruption)</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded bg-slate-800/40">
                    <span className="text-cyan-400 font-mono text-xs mt-0.5">→</span>
                    <span><strong className="text-slate-200">Sharing tests?</strong> Export → JSON (works everywhere)</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded bg-orange-500/10 border border-orange-500/30">
                    <span className="text-orange-400 font-mono text-xs mt-0.5">!</span>
                    <span className="text-orange-300"><strong>Avoid Save button</strong> — .duckdb files are unreliable</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      , document.body)}
    </>
  );
}
