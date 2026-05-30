import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useDB } from '../hooks/useDB';
import { getAllGroups, getAllSubgroups } from '../db/queries/groups';
import { createGroup, deleteGroup, createSubgroup, deleteSubgroup } from '../db/mutations/groups';
import type { TestGroup, TestSubgroup } from '../types/quiz';

export default function ManageGroupsPage() {
  const { query, run, isInitialized } = useDB();
  const [groups, setGroups] = useState<TestGroup[]>([]);
  const [subgroups, setSubgroups] = useState<TestSubgroup[]>([]);
  const [loading, setLoading] = useState(true);

  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#667eea');
  const [newSubgroupName, setNewSubgroupName] = useState('');
  const [newSubgroupGroupId, setNewSubgroupGroupId] = useState<number | null>(null);

  useEffect(() => {
    if (!isInitialized) return;
    loadData();
  }, [isInitialized]);

  async function loadData() {
    try {
      const [g, s] = await Promise.all([getAllGroups(query), getAllSubgroups(query)]);
      setGroups(g);
      setSubgroups(s);
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    await createGroup(run, query, { name: newGroupName, color: newGroupColor });
    setNewGroupName('');
    await loadData();
  };

  const handleDeleteGroup = async (id: number) => {
    if (!confirm('Delete group? Tests in it will become ungrouped.')) return;
    await deleteGroup(run, id);
    await loadData();
  };

  const handleAddSubgroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubgroupName.trim() || !newSubgroupGroupId) return;
    await createSubgroup(run, query, { name: newSubgroupName, group_id: newSubgroupGroupId });
    setNewSubgroupName('');
    await loadData();
  };

  const handleDeleteSubgroup = async (id: number) => {
    if (!confirm('Delete subgroup?')) return;
    await deleteSubgroup(run, id);
    await loadData();
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Manage Groups</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Groups */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-white">Groups ({groups.length})</h2>
          
          <form onSubmit={handleAddGroup} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Group name"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
            <input
              type="color"
              value={newGroupColor}
              onChange={(e) => setNewGroupColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              +
            </button>
          </form>

          <div className="space-y-2">
            {groups.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No groups</p>
            ) : (
              groups.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: g.color }}
                    />
                    <span className="text-white">{g.name}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteGroup(g.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Subgroups */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-white">Subgroups ({subgroups.length})</h2>
          
          <form onSubmit={handleAddSubgroup} className="flex gap-2 mb-4">
            <select
              value={newSubgroupGroupId ?? ''}
              onChange={(e) => setNewSubgroupGroupId(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="">Group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <input
              type="text"
              value={newSubgroupName}
              onChange={(e) => setNewSubgroupName(e.target.value)}
              placeholder="Subgroup name"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
            <button
              type="submit"
              disabled={!newSubgroupGroupId}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              +
            </button>
          </form>

          <div className="space-y-2">
            {subgroups.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No subgroups</p>
            ) : (
              subgroups.map((s) => {
                const group = groups.find((g) => g.id === s.group_id);
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="text-white">{s.name}</span>
                      {group && (
                        <span className="text-xs text-gray-500">({group.name})</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteSubgroup(s.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Link to="/tests" className="text-blue-400 hover:text-blue-300 hover:underline">
          ← Back to Tests
        </Link>
      </div>
    </div>
  );
}
