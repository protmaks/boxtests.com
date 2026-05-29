import { Link, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useDB } from '../hooks/useDB';
import { getTestById } from '../db/queries/tests';
import { getSessionProgress, clearSession, resetMistakesOnly } from '../db/queries/session';
import type { Test } from '../types/quiz';

export default function TestModeSelector() {
  const { id } = useParams<{ id: string }>();
  const { query, run, isInitialized } = useDB();
  const [test, setTest] = useState<Test | null>(null);
  const [progress, setProgress] = useState<{
    total: number;
    correct: number;
    incorrect: number;
    dontKnow: number;
  } | null>(null);
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
    setProgress({ total: 0, correct: 0, incorrect: 0, dontKnow: 0 });
  };

  const handleResetMistakes = async () => {
    if (!id) return;
    await resetMistakesOnly(run, parseInt(id));
    const newProgress = await getSessionProgress(query, parseInt(id));
    setProgress(newProgress);
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
        <p className="text-red-500">Тест не найден</p>
        <Link to="/tests" className="text-indigo-600 hover:underline">
          Вернуться к списку
        </Link>
      </div>
    );
  }

  const hasProgress = progress && progress.total > 0;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{test.display_name}</h1>
      {test.description && (
        <p className="text-gray-600 dark:text-gray-400 mb-6">{test.description}</p>
      )}

      {hasProgress && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
          <p className="text-blue-800 dark:text-blue-300 mb-2">
            У вас есть прогресс в этом тесте:
          </p>
          <div className="text-sm text-blue-600 dark:text-blue-400">
            ✓ {progress.correct} правильных, ✗ {progress.incorrect} неправильных,
            ? {progress.dontKnow} не знаю
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleResetMistakes}
              className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Сбросить ошибки
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              Сбросить всё
            </button>
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold mb-4">Выберите режим:</h2>
      <div className="grid gap-4">
        <Link
          to={`/test/${id}`}
          className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold mb-2">📄 Режим одной страницы</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Все вопросы на одной странице. Результат после отправки всех ответов.
          </p>
        </Link>
        <Link
          to={`/test/${id}/instant`}
          className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold mb-2">⚡ Instant режим</h3>
          <p className="text-gray-600 dark:text-gray-400">
            По одному вопросу. Немедленная проверка после каждого ответа.
            {hasProgress && ' Продолжите с того места, где остановились.'}
          </p>
        </Link>
      </div>
      <div className="mt-6 text-center">
        <Link to="/tests" className="text-indigo-600 hover:underline">
          ← Вернуться к списку
        </Link>
      </div>
    </div>
  );
}
