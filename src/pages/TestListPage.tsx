import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useDB } from '../hooks/useDB';
import { getTestsGrouped } from '../db/queries/tests';
import { getAllStatistics } from '../db/queries/statistics';
import type { Test, TestStatistics } from '../types/quiz';
import { useSEO } from '../hooks/useSEO';
import { SEO_CONFIGS } from '../utils/seo';

export default function TestListPage() {
  useSEO(SEO_CONFIGS.tests);
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
        <div className="inline-flex items-center gap-3 px-6 py-4 bg-slate-800/40 backdrop-blur-xl rounded-xl border border-cyan-500/20">
          <div className="relative w-6 h-6">
            <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-cyan-400 font-mono">Loading tests...</p>
        </div>
      </div>
    );
  }

  const totalTests = groups.reduce((acc, g) => acc + g.tests.length, 0);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gradient mb-2">My Tests</h1>
          <p className="text-slate-400 font-mono text-sm">
            {totalTests} {totalTests === 1 ? 'test' : 'tests'} available
          </p>
        </div>
        <Link
          to="/create"
          className="group relative px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(14,165,233,0.5)]"
        >
          <span className="relative z-10 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Test
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </Link>
      </div>

      {totalTests === 0 ? (
        <div className="bg-slate-800/40 backdrop-blur-xl rounded-xl border border-cyan-500/20 shadow-[0_0_30px_rgba(14,165,233,0.1)] p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center">
            <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-slate-300 text-lg mb-2 font-semibold">No tests yet</p>
          <p className="text-slate-500 mb-6 font-mono text-sm">
            Create your first test or load a .duckdb file
          </p>
          <Link
            to="/create"
            className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:scale-105 transition-transform duration-300"
          >
            Create Test
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.group_id ?? 'ungrouped'}>
              <h2
                className="text-xl font-bold mb-4 flex items-center gap-3 font-mono"
              >
                <span
                  className="w-4 h-4 rounded-lg shadow-lg"
                  style={{ 
                    backgroundColor: group.group_color || '#0ea5e9',
                    boxShadow: `0 0 15px ${group.group_color || '#0ea5e9'}40`
                  }}
                />
                <span className="text-gradient">{group.group_name || 'Ungrouped'}</span>
                <span className="text-sm font-normal text-slate-500 bg-slate-800/50 px-2 py-1 rounded-lg">
                  {group.tests.length}
                </span>
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {group.tests.map((test) => {
                  const testStats = stats.get(test.test_id);
                  const percentage =
                    testStats && testStats.total_questions_answered > 0
                      ? Math.round(
                          (testStats.total_correct_answers /
                            testStats.total_questions_answered) *
                            100
                        )
                      : null;

                  return (
                    <Link
                      key={test.test_id}
                      to={`/test/${test.test_id}/mode`}
                      className="group relative bg-slate-800/40 backdrop-blur-xl rounded-xl border border-cyan-500/20 shadow-[0_0_20px_rgba(14,165,233,0.08)] p-6 hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(14,165,233,0.2)] transition-all duration-300 overflow-hidden"
                    >
                      {/* Hover gradient effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-purple-500/0 group-hover:from-cyan-500/5 group-hover:to-purple-500/5 transition-all duration-300"></div>
                      
                      <div className="relative z-10">
                        <h3 className="font-bold text-lg text-slate-200 mb-2 group-hover:text-cyan-400 transition-colors">
                          {test.display_name}
                        </h3>
                        {test.description && (
                          <p className="text-sm text-slate-400 mb-3 line-clamp-2 leading-relaxed">
                            {test.description}
                          </p>
                        )}
                        {testStats && (
                          <div className="flex items-center gap-3 text-xs font-mono">
                            <span className="text-slate-500">
                              {testStats.total_attempts} {testStats.total_attempts === 1 ? 'attempt' : 'attempts'}
                            </span>
                            {percentage !== null && (
                              <span
                                className={`px-2 py-1 rounded-lg font-semibold ${
                                  percentage >= 70
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : percentage >= 50
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {percentage}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Arrow indicator */}
                      <div className="absolute bottom-4 right-4 text-cyan-500 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
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
