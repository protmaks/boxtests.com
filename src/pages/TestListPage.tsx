import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useDB } from '../hooks/useDB';
import { getTestsGrouped } from '../db/queries/tests';
import { getAllStatistics } from '../db/queries/statistics';
import type { Test, TestStatistics } from '../types/quiz';

export default function TestListPage() {
  const { query, isLoading, isInitialized } = useDB();
  const [groups, setGroups] = useState<
    { group_id: number | null; group_name: string | null; group_color: string | null; tests: Test[] }[]
  >([]);
  const [stats, setStats] = useState<Map<number, TestStatistics>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isInitialized) return;

    async function loadData() {
      try {
        const [groupedTests, allStats] = await Promise.all([
          getTestsGrouped(query),
          getAllStatistics(query),
        ]);
        setGroups(groupedTests);
        setStats(new Map(allStats.map((s) => [s.test_id, s])));
      } catch (err) {
        console.error('Failed to load tests:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [query, isInitialized]);

  if (isLoading || loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-2 text-gray-500">Загрузка тестов...</p>
      </div>
    );
  }

  const totalTests = groups.reduce((acc, g) => acc + g.tests.length, 0);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Мои тесты ({totalTests})</h1>
        <Link
          to="/create"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          + Создать тест
        </Link>
      </div>

      {totalTests === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Пока нет тестов. Создайте первый тест или загрузите .duckdb файл.
          </p>
          <Link
            to="/create"
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Создать тест
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.group_id ?? 'ungrouped'}>
              <h2
                className="text-lg font-semibold mb-3 flex items-center gap-2"
                style={{ color: group.group_color || undefined }}
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: group.group_color || '#667eea' }}
                />
                {group.group_name || 'Без группы'}
                <span className="text-sm font-normal text-gray-500">
                  ({group.tests.length})
                </span>
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {group.tests.map((test) => {
                  const testStats = stats.get(test.test_id);
                  const percentage =
                    testStats && testStats.total_attempts > 0
                      ? Math.round(
                          (testStats.total_correct /
                            (testStats.total_correct + testStats.total_incorrect)) *
                            100
                        )
                      : null;

                  return (
                    <Link
                      key={test.test_id}
                      to={`/test/${test.test_id}/mode`}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-lg transition-shadow"
                    >
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                        {test.display_name}
                      </h3>
                      {test.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                          {test.description}
                        </p>
                      )}
                      {testStats && (
                        <div className="text-xs text-gray-400">
                          {testStats.total_attempts} попыток
                          {percentage !== null && (
                            <span
                              className={`ml-2 ${
                                percentage >= 70
                                  ? 'text-green-600'
                                  : percentage >= 50
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {percentage}%
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
