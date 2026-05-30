import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDuckDB } from '../context/DuckDBContext';
import { getTestsGrouped } from '../db/queries/tests';
import type { Test } from '../types/quiz';

type ExportFormat = 'json' | 'txt';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { query, conn, db } = useDuckDB();
  const [groups, setGroups] = useState<
    { group_id: number | null; group_name: string | null; group_color: string | null; tests: Test[] }[]
  >([]);
  const [selectedTests, setSelectedTests] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');

  useEffect(() => {
    if (!isOpen) return;

    async function loadTests() {
      try {
        setLoading(true);
        const groupedTests = await getTestsGrouped(query);
        setGroups(groupedTests);
        setSelectedTests(new Set());
      } catch (err) {
        console.error('Failed to load tests:', err);
      } finally {
        setLoading(false);
      }
    }

    loadTests();
  }, [query, isOpen]);

  const totalTests = groups.reduce((acc, g) => acc + g.tests.length, 0);
  const allTestIds = groups.flatMap((g) => g.tests.map((t) => t.test_id));

  const toggleTest = (testId: number) => {
    const newSet = new Set(selectedTests);
    if (newSet.has(testId)) {
      newSet.delete(testId);
    } else {
      newSet.add(testId);
    }
    setSelectedTests(newSet);
  };

  const toggleAll = () => {
    if (selectedTests.size === totalTests) {
      setSelectedTests(new Set());
    } else {
      setSelectedTests(new Set(allTestIds));
    }
  };

  const toggleGroup = (groupTests: Test[]) => {
    const groupTestIds = groupTests.map((t) => t.test_id);
    const allSelected = groupTestIds.every((id) => selectedTests.has(id));
    const newSet = new Set(selectedTests);

    if (allSelected) {
      groupTestIds.forEach((id) => newSet.delete(id));
    } else {
      groupTestIds.forEach((id) => newSet.add(id));
    }
    setSelectedTests(newSet);
  };

  const handleExport = async () => {
    if (selectedTests.size === 0 || !db || !conn) return;

    try {
      setExporting(true);
      const testIds = Array.from(selectedTests).join(',');

      if (exportFormat === 'json') {
        await exportAsJSON(testIds);
      } else {
        await exportAsTxt(testIds);
      }

      onClose();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export tests: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setExporting(false);
    }
  };

  const exportAsJSON = async (testIds: string) => {
    try {
      // Force checkpoint to ensure data consistency
      if (conn) {
        await conn.query('CHECKPOINT');
      }
      
      // Get all data for selected tests
      const tests = await query<Record<string, unknown>>(`
        SELECT * FROM tests WHERE test_id IN (${testIds})
      `);
      const questions = await query<Record<string, unknown>>(`
        SELECT * FROM questions WHERE test_id IN (${testIds})
      `);

      // Get related groups
      const groupIds = [...new Set(tests.map((t) => t.group_id).filter(Boolean))];
      const groupsData = groupIds.length > 0 
        ? await query<Record<string, unknown>>(`SELECT * FROM test_groups WHERE id IN (${groupIds.join(',')})`)
        : [];

      // Get related subgroups
      const subgroupIds = [...new Set(tests.map((t) => t.subgroup_id).filter(Boolean))];
      const subgroups = subgroupIds.length > 0
        ? await query<Record<string, unknown>>(`SELECT * FROM test_subgroups WHERE id IN (${subgroupIds.join(',')})`)
        : [];

      // Get related difficulty levels
      const difficultyIds = [...new Set(tests.map((t) => t.difficulty_level_id).filter(Boolean))];
      const difficulties = difficultyIds.length > 0
        ? await query<Record<string, unknown>>(`SELECT * FROM difficulty_levels WHERE id IN (${difficultyIds.join(',')})`)
        : [];

      // Create export JSON structure
      const exportData = {
        version: 1,
        exported_at: new Date().toISOString(),
        test_groups: groupsData,
        test_subgroups: subgroups,
        difficulty_levels: difficulties,
        tests,
        questions,
      };

      // Download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tests_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('JSON export error:', err);
      
      // Provide helpful error message
      if (err instanceof Error && err.message.includes('checksum')) {
        throw new Error(
          'Database corruption detected. Your database file is corrupted.\n\n' +
          'Try these steps:\n' +
          '1. Click "Clear Database" to start fresh\n' +
          '2. Recreate your tests\n' +
          '3. Use Export → JSON regularly for backups\n' +
          '4. Avoid using Save button for tests with images'
        );
      }
      throw err;
    }
  };

  const exportAsTxt = async (testIds: string) => {
    // Get tests with questions
    const tests = await query<{ test_id: number; display_name: string; description: string | null }>(`
      SELECT test_id, display_name, description FROM tests WHERE test_id IN (${testIds}) ORDER BY display_name
    `);

    const questions = await query<{
      id: number;
      question_text: string;
      id_var: string;
      options: string;
      correct_answer: boolean | string | number;
      test_id: number;
      explanation: string | null;
    }>(`
      SELECT id, question_text, id_var, options, correct_answer, test_id, explanation
      FROM questions WHERE test_id IN (${testIds}) ORDER BY test_id, id, id_var
    `);

    // Build text output
    let output = '';

    for (const test of tests) {
      output += `${'='.repeat(60)}\n`;
      output += `TEST: ${test.display_name}\n`;
      if (test.description) {
        output += `Description: ${test.description}\n`;
      }
      output += `${'='.repeat(60)}\n\n`;

      // Group questions by id
      const testQuestions = questions.filter(q => q.test_id === test.test_id);
      const questionMap = new Map<number, { text: string; explanation: string | null; options: { letter: string; text: string; correct: boolean }[] }>();

      for (const q of testQuestions) {
        if (!questionMap.has(q.id)) {
          questionMap.set(q.id, { text: q.question_text, explanation: q.explanation, options: [] });
        }
        // DuckDB may return boolean as string, number, or actual boolean
        const isCorrect = q.correct_answer === true || String(q.correct_answer) === 'true' || String(q.correct_answer) === '1';
        questionMap.get(q.id)!.options.push({
          letter: q.id_var,
          text: q.options,
          correct: isCorrect,
        });
      }

      let qNum = 1;
      for (const [, q] of questionMap) {
        output += `${qNum}. ${q.text}\n`;
        for (const opt of q.options) {
          const marker = opt.correct ? ' ✓' : '';
          output += `   ${opt.letter}) ${opt.text}${marker}\n`;
        }
        if (q.explanation) {
          output += `   Explanation: ${q.explanation}\n`;
        }
        output += '\n';
        qNum++;
      }

      output += '\n';
    }

    // Download
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tests_export_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(14,165,233,0.2)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-slate-800/50">
          <h2 className="text-xl font-bold text-gradient">Export Tests</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-140px)] p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="inline-flex items-center gap-3 px-6 py-4 bg-slate-800/40 rounded-xl border border-cyan-500/20">
                <div className="relative w-5 h-5">
                  <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-full"></div>
                  <div className="absolute inset-0 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <span className="text-cyan-400 font-mono text-sm">Loading tests...</span>
              </div>
            </div>
          ) : totalTests === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No tests available for export
            </div>
          ) : (
            <div className="space-y-4">
              {/* Format selection */}
              <div className="p-4 bg-slate-800/50 rounded-lg border border-cyan-500/20">
                <label className="block text-sm font-semibold text-slate-300 mb-3">Export Format</label>
                <div className="flex gap-3">
                  <label className={`flex-1 flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    exportFormat === 'json' 
                      ? 'border-cyan-500 bg-cyan-500/10' 
                      : 'border-slate-600 hover:border-slate-500'
                  }`}>
                    <input
                      type="radio"
                      name="exportFormat"
                      value="json"
                      checked={exportFormat === 'json'}
                      onChange={() => setExportFormat('json')}
                      className="w-4 h-4 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 bg-slate-700 border-slate-600"
                    />
                    <div>
                      <span className="font-medium text-slate-200">.json</span>
                      <p className="text-xs text-slate-400 mt-0.5">Data file for import</p>
                    </div>
                  </label>
                  <label className={`flex-1 flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    exportFormat === 'txt' 
                      ? 'border-cyan-500 bg-cyan-500/10' 
                      : 'border-slate-600 hover:border-slate-500'
                  }`}>
                    <input
                      type="radio"
                      name="exportFormat"
                      value="txt"
                      checked={exportFormat === 'txt'}
                      onChange={() => setExportFormat('txt')}
                      className="w-4 h-4 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 bg-slate-700 border-slate-600"
                    />
                    <div>
                      <span className="font-medium text-slate-200">.txt</span>
                      <p className="text-xs text-slate-400 mt-0.5">Human-readable text format</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Select all */}
              <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-cyan-500/20 cursor-pointer hover:border-cyan-500/40 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedTests.size === totalTests}
                  onChange={toggleAll}
                  className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="font-semibold text-slate-200">
                  Select All ({totalTests})
                </span>
              </label>

              {/* Groups */}
              {groups.map((group) => (
                <div key={group.group_id ?? 'ungrouped'} className="space-y-2">
                  {/* Group header */}
                  <label className="flex items-center gap-3 p-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={group.tests.every((t) => selectedTests.has(t.test_id))}
                      onChange={() => toggleGroup(group.tests)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span
                      className="w-3 h-3 rounded"
                      style={{
                        backgroundColor: group.group_color || '#0ea5e9',
                        boxShadow: `0 0 8px ${group.group_color || '#0ea5e9'}40`,
                      }}
                    />
                    <span className="font-semibold text-slate-300 group-hover:text-white transition-colors">
                      {group.group_name || 'Ungrouped'}
                    </span>
                    <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded">
                      {group.tests.length}
                    </span>
                  </label>

                  {/* Tests in group */}
                  <div className="ml-6 space-y-1">
                    {group.tests.map((test) => (
                      <label
                        key={test.test_id}
                        className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-slate-800/30 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTests.has(test.test_id)}
                          onChange={() => toggleTest(test.test_id)}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer"
                        />
                        <span className="text-slate-300">{test.display_name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-cyan-500/20 bg-slate-800/50">
          <span className="text-sm text-slate-400 font-mono">
            {selectedTests.size} test{selectedTests.size !== 1 ? 's' : ''} selected • .{exportFormat}
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-600 transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={selectedTests.size === 0 || exporting}
              className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(14,165,233,0.4)] transition-all"
            >
              {exporting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Exporting...
                </span>
              ) : (
                `Export as .${exportFormat}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
