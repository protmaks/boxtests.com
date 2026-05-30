import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useDB } from '../hooks/useDB';
import { getAllGroups, getAllDifficultyLevels } from '../db/queries/groups';
import { createDifficultyLevel, deleteDifficultyLevel } from '../db/mutations/groups';
import type { TestGroup, DifficultyLevel } from '../types/quiz';
import { useSEO } from '../hooks/useSEO';
import { SEO_CONFIGS } from '../utils/seo';

export default function ManageDifficultyPage() {
  useSEO(SEO_CONFIGS.manageDifficulty);
  const { query, run, isInitialized } = useDB();
  const [groups, setGroups] = useState<TestGroup[]>([]);
  const [levels, setLevels] = useState<DifficultyLevel[]>([]);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState('');
  const [newGroupId, setNewGroupId] = useState<number | null>(null);
  const [newColor, setNewColor] = useState('#667eea');

  useEffect(() => {
    if (!isInitialized) return;
    loadData();
  }, [isInitialized]);

  async function loadData() {
    try {
      const [g, l] = await Promise.all([
        getAllGroups(query),
        getAllDifficultyLevels(query),
      ]);
      setGroups(g);
      setLevels(l);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newGroupId) return;
    await createDifficultyLevel(run, query, {
      name: newName,
      group_id: newGroupId,
      color: newColor,
    });
    setNewName('');
    await loadData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete difficulty level?')) return;
    await deleteDifficultyLevel(run, id);
    await loadData();
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const groupedLevels = groups.map((g) => ({
    group: g,
    levels: levels.filter((l) => l.group_id === g.id),
  }));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Difficulty Levels</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-white">Add Level</h2>
        <form onSubmit={handleAdd} className="flex gap-2">
          <select
            value={newGroupId ?? ''}
            onChange={(e) => setNewGroupId(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="">Select Group</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Level name"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          />
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer"
          />
          <button
            type="submit"
            disabled={!newGroupId || !newName.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            Add
          </button>
        </form>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            First create test groups
          </p>
          <Link to="/manage/groups" className="text-indigo-600 hover:underline">
            Go to group management
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedLevels.map(({ group, levels: groupLevels }) => (
            <div key={group.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3
                className="text-lg font-semibold mb-4 flex items-center gap-2 text-white"
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: group.color }}
                />
                {group.name}
              </h3>
              {groupLevels.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No difficulty levels for this group
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {groupLevels.map((level) => (
                    <div
                      key={level.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-full"
                      style={{
                        backgroundColor: `${level.color}20`,
                        border: `1px solid ${level.color}`,
                      }}
                    >
                      <span style={{ color: level.color }}>{level.name}</span>
                      <button
                        onClick={() => handleDelete(level.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <Link to="/tests" className="text-blue-400 hover:text-blue-300 hover:underline">
          ← Back to Tests
        </Link>
      </div>
    </div>
  );
}
