import { Link, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useDB } from '../hooks/useDB';
import { getTestById } from '../db/queries/tests';
import { getSessionProgress, clearSession } from '../db/queries/session';
import type { Test } from '../types/quiz';

export default function TestModeSelector() {
  const { id } = useParams<{ id: string }>();
  const { query, run, isInitialized } = useDB();
  const [test, setTest] = useState<Test | null>(null);
  const [progress, setProgress] = useState<{ answered: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isInitialized || !id) return;

    async function loadData() {
      try {
        const [testData, sessionProgress] = await Promise.all([
          getTestById(query, parseInt(id!)),
          getSessionProgress(query, parseInt(id!)),
        ]);
        setTest(testData);
        setProgress(sessionProgress);
      } catch (err) {
        console.error('Failed to load test:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, query, isInitialized]);

  const handleReset = async () => {
    if (!id) return;
    await clearSession(run, parseInt(id));
    setProgress({ answered: 0 });
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Test not found</p>
        <Link to="/tests" className="text-indigo-600 hover:underline">
          Back to list
        </Link>
      </div>
    );
  }

  const hasProgress = progress && progress.answered > 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-2 text-white">{test.display_name}</h1>
      {test.description && (
        <p className="text-gray-400 dark:text-white mb-6">{test.description}</p>
      )}

      {hasProgress && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
          <p className="text-blue-800 dark:text-blue-300 mb-2">
            You have progress in this test: {progress.answered} questions answered
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleReset}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              Reset All
            </button>
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold mb-4 text-white">Choose Mode:</h2>
      <div className="grid gap-4">
        <Link
          to={`/test/${id}`}
          className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">📄 Single Page Mode</h3>
          <p className="text-gray-600 dark:text-gray-400">
            All questions on one page. Results after submitting all answers.
          </p>
        </Link>
        <Link
          to={`/test/${id}/instant`}
          className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">⚡ Instant Mode</h3>
          <p className="text-gray-600 dark:text-gray-400">
            One question at a time. Immediate feedback after each answer.
            {hasProgress && ' Continue where you left off.'}
          </p>
        </Link>
      </div>
      <div className="mt-6 text-center">
        <Link to="/tests" className="text-blue-400 hover:text-blue-300 hover:underline">
          ← Back to list
        </Link>
      </div>
    </div>
  );
}
