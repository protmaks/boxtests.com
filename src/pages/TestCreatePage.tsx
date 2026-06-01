import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useDB } from '../hooks/useDB';
import { getAllGroups, getAllSubgroups, getAllDifficultyLevels } from '../db/queries/groups';
import { createGroup, createSubgroup, createDifficultyLevel } from '../db/mutations/groups';
import { createTest } from '../db/mutations/tests';
import { createQuestion } from '../db/mutations/questions';
import type { TestGroup, TestSubgroup, DifficultyLevel } from '../types/quiz';
import { useSEO } from '../hooks/useSEO';
import { SEO_CONFIGS } from '../utils/seo';
import { RichTextEditor } from '../components/RichTextEditor';
import { InlineCreateSelect } from '../components/InlineCreateSelect';

type QuestionDraft = {
  id: string;
  question_text: string;
  options: Array<{
    letter: string;
    text: string;
    is_correct: boolean;
  }>;
};

export default function TestCreatePage() {
  useSEO(SEO_CONFIGS.create);
  const navigate = useNavigate();
  const { query, run, isInitialized } = useDB();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [groupId, setGroupId] = useState<number | null>(null);
  const [subgroupId, setSubgroupId] = useState<number | null>(null);
  const [difficultyId, setDifficultyId] = useState<number | null>(null);

  const [groups, setGroups] = useState<TestGroup[]>([]);
  const [subgroups, setSubgroups] = useState<TestSubgroup[]>([]);
  const [difficulties, setDifficulties] = useState<DifficultyLevel[]>([]);

  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    const [g, s, d] = await Promise.all([
      getAllGroups(query),
      getAllSubgroups(query),
      getAllDifficultyLevels(query),
    ]);
    setGroups(g);
    setSubgroups(s);
    setDifficulties(d);
  };

  useEffect(() => {
    if (!isInitialized) return;
    loadData();
  }, [query, isInitialized]);

  const addQuestion = () => {
    const id = `q-${Date.now()}`;
    setQuestions((prev) => [
      ...prev,
      {
        id,
        question_text: '',
        options: [
          { letter: 'a', text: '', is_correct: true },
          { letter: 'b', text: '', is_correct: false },
        ],
      },
    ]);
  };

  const updateQuestion = (id: string, text: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, question_text: text } : q))
    );
  };

  const updateOption = (
    questionId: string,
    optionIdx: number,
    field: 'text' | 'is_correct',
    value: string | boolean
  ) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const newOptions = [...q.options];
        if (field === 'text') {
          newOptions[optionIdx] = { ...newOptions[optionIdx], text: value as string };
        } else {
          newOptions[optionIdx] = { ...newOptions[optionIdx], is_correct: value as boolean };
        }
        return { ...q, options: newOptions };
      })
    );
  };

  const addOption = (questionId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const nextLetter = String.fromCharCode(97 + q.options.length);
        return {
          ...q,
          options: [...q.options, { letter: nextLetter, text: '', is_correct: false }],
        };
      })
    );
  };

  const removeOption = (questionId: string, optionIdx: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        // Don't allow removing if only 2 options left
        if (q.options.length <= 2) return q;
        const newOptions = q.options.filter((_, idx) => idx !== optionIdx);
        // Re-assign letters sequentially
        return {
          ...q,
          options: newOptions.map((opt, idx) => ({
            ...opt,
            letter: String.fromCharCode(97 + idx),
          })),
        };
      })
    );
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate test name
    if (!name.trim()) {
      alert('Enter a test name');
      return;
    }
    
    // Check for null bytes and other problematic characters
    if (name.includes('\0') || description.includes('\0')) {
      alert('Test name or description contains invalid characters. Please remove null bytes.');
      return;
    }

    // Validate question sizes (Base64 images can be large)
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      // Check for problematic characters
      if (q.question_text.includes('\0')) {
        alert(`Question ${i + 1} contains invalid characters (null bytes). Please remove them.`);
        return;
      }
      
      // Check question size
      if (q.question_text.length > 1000000) { // 1MB limit per question
        alert(
          `Question ${i + 1} is too large (${Math.round(q.question_text.length / 1024)}KB).\n\n` +
          'Questions with very large images may fail to save.\n' +
          'Consider using smaller images (under 500KB) or external image URLs.'
        );
        return;
      }
      
      // Validate options
      for (let j = 0; j < q.options.length; j++) {
        const opt = q.options[j];
        if (opt.text.includes('\0')) {
          alert(`Question ${i + 1}, Option ${opt.letter.toUpperCase()} contains invalid characters.`);
          return;
        }
        if (opt.text.length > 100000) { // 100KB limit per option
          alert(`Question ${i + 1}, Option ${opt.letter.toUpperCase()} is too large (${Math.round(opt.text.length / 1024)}KB).`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const testId = await createTest(run, query, {
        display_name: name,
        description: description || null,
        group_id: groupId,
        subgroup_id: subgroupId,
        difficulty_level_id: difficultyId,
      });

      for (const q of questions) {
        if (q.question_text.trim() && q.options.some((o) => o.text.trim())) {
          await createQuestion(run, query, testId, {
            question_text: q.question_text,
            options: q.options
              .filter((o) => o.text.trim())
              .map((o) => ({
                option_letter: o.letter,
                option_text: o.text,
                is_correct: o.is_correct,
              })),
          });
        }
      }

      navigate(`/test/${testId}/mode`);
    } catch (err) {
      console.error('Failed to create test:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      let userMessage = 'Error creating test:\n\n' + errorMessage;
      
      // Add specific suggestions based on error type
      if (errorMessage.includes('memory access out of bounds')) {
        userMessage += '\n\n💡 This error usually means:\n' +
          '• Rich text contains unsupported characters\n' +
          '• Try using plain text instead of formatted text\n' +
          '• Remove or replace special symbols\n' +
          '• Check for invisible characters (copy-paste issues)';
      }
      
      userMessage += '\n\nCheck the console for more details.';
      alert(userMessage);
    } finally {
      setSaving(false);
    }
  };

  const filteredSubgroups = groupId
    ? subgroups.filter((s) => s.group_id === groupId)
    : [];
  const filteredDifficulties = groupId
    ? difficulties.filter((d) => d.group_id === groupId)
    : [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white dark:text-white">Create Test</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Test Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="Enter name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              rows={3}
              placeholder="Test description"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <InlineCreateSelect
              label="Group"
              value={groupId}
              onChange={(value) => {
                setGroupId(value);
                setSubgroupId(null);
                setDifficultyId(null);
              }}
              options={groups}
              onCreateNew={async (data) => {
                const newId = await createGroup(run, query, data);
                return newId;
              }}
              onRefresh={loadData}
              createLabel="Create New Group"
              emptyLabel="No Group"
              formFields={[
                { name: 'name', label: 'Group Name', type: 'text', required: true, placeholder: 'Enter group name' },
                { name: 'color', label: 'Color', type: 'color', defaultValue: '#667eea' },
              ]}
            />
            <InlineCreateSelect
              label="Subgroup"
              value={subgroupId}
              onChange={setSubgroupId}
              options={filteredSubgroups}
              disabled={!groupId}
              onCreateNew={async (data) => {
                const newId = await createSubgroup(run, query, { ...data, group_id: groupId! });
                return newId;
              }}
              onRefresh={loadData}
              createLabel="Create New Subgroup"
              emptyLabel="None"
              requiresParent={true}
              parentSelected={!!groupId}
              parentMessage="Please select a group first"
              formFields={[
                { name: 'name', label: 'Subgroup Name', type: 'text', required: true, placeholder: 'Enter subgroup name' },
              ]}
            />
            <InlineCreateSelect
              label="Difficulty"
              value={difficultyId}
              onChange={setDifficultyId}
              options={filteredDifficulties}
              disabled={!groupId}
              onCreateNew={async (data) => {
                const newId = await createDifficultyLevel(run, query, { ...data, group_id: groupId! });
                return newId;
              }}
              onRefresh={loadData}
              createLabel="Create New Difficulty"
              emptyLabel="None"
              requiresParent={true}
              parentSelected={!!groupId}
              parentMessage="Please select a group first"
              formFields={[
                { name: 'name', label: 'Difficulty Name', type: 'text', required: true, placeholder: 'Enter difficulty name' },
                { name: 'color', label: 'Color', type: 'color', defaultValue: '#667eea' },
              ]}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white dark:text-white">Questions ({questions.length})</h2>
            <button
              type="button"
              onClick={addQuestion}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              + Add Question
            </button>
          </div>

          <div className="space-y-4">
            {questions.map((q, qIdx) => (
              <div key={q.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm text-gray-500">Question {qIdx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeQuestion(q.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="mb-3">
                  <RichTextEditor
                    value={q.question_text}
                    onChange={(html) => updateQuestion(q.id, html)}
                    placeholder="Enter question text... (you can add images)"
                  />
                </div>
                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => (
                    <div key={opt.letter} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={opt.is_correct}
                        onChange={(e) => updateOption(q.id, optIdx, 'is_correct', e.target.checked)}
                        className="w-5 h-5"
                        title="Correct answer"
                      />
                      <span className="w-6 text-center font-medium">{opt.letter.toUpperCase()}</span>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => updateOption(q.id, optIdx, 'text', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        placeholder={`Option ${opt.letter.toUpperCase()}`}
                      />
                      {q.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(q.id, optIdx)}
                          className="text-red-500 hover:text-red-700 px-2"
                          title="Remove option"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addOption(q.id)}
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    + Add Option
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Create Test'}
          </button>
          <Link
            to="/tests"
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
