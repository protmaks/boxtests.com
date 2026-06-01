import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useDB } from '../hooks/useDB';
import { getAllGroups, getAllSubgroups, getAllDifficultyLevels } from '../db/queries/groups';
import { getTestWithQuestions } from '../db/queries/tests';
import { updateTest } from '../db/mutations/tests';
import { createQuestion, updateQuestion, deleteQuestion } from '../db/mutations/questions';
import type { TestGroup, TestSubgroup, DifficultyLevel } from '../types/quiz';
import { useSEO } from '../hooks/useSEO';
import { RichTextEditor } from '../components/RichTextEditor';

type QuestionDraft = {
  id: string;
  originalId?: number; // For tracking existing questions
  question_text: string;
  options: Array<{
    letter: string;
    text: string;
    is_correct: boolean;
  }>;
};

export default function TestEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { query, run, isInitialized } = useDB();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [groupId, setGroupId] = useState<number | null>(null);
  const [subgroupId, setSubgroupId] = useState<number | null>(null);
  const [difficultyId, setDifficultyId] = useState<number | null>(null);

  const [groups, setGroups] = useState<TestGroup[]>([]);
  const [subgroups, setSubgroups] = useState<TestSubgroup[]>([]);
  const [difficulties, setDifficulties] = useState<DifficultyLevel[]>([]);

  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [originalQuestionIds, setOriginalQuestionIds] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  useSEO({
    title: `Edit Test - BoxTests`,
    description: 'Edit your test',
  });

  useEffect(() => {
    if (!isInitialized || !id) return;

    async function loadData() {
      try {
        const [testData, g, s, d] = await Promise.all([
          getTestWithQuestions(query, parseInt(id!)),
          getAllGroups(query),
          getAllSubgroups(query),
          getAllDifficultyLevels(query),
        ]);

        if (!testData) {
          setLoading(false);
          return;
        }

        // Set test metadata
        setName(testData.display_name);
        setDescription(testData.description || '');
        setGroupId(testData.group_id);
        setSubgroupId(testData.subgroup_id);
        setDifficultyId(testData.difficulty_level_id);

        // Convert questions to draft format
        const drafts: QuestionDraft[] = testData.questions.map((q) => ({
          id: `q-${q.id}`,
          originalId: q.id,
          question_text: q.question_text,
          options: q.options.map((opt) => ({
            letter: opt.option_letter,
            text: opt.option_text,
            is_correct: typeof opt.is_correct === 'string' 
              ? opt.is_correct === 'true' || opt.is_correct === '1'
              : opt.is_correct,
          })),
        }));

        setQuestions(drafts);
        setOriginalQuestionIds(new Set(testData.questions.map((q) => q.id)));

        setGroups(g);
        setSubgroups(s);
        setDifficulties(d);
      } catch (err) {
        console.error('Failed to load test:', err);
        alert('Failed to load test data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [query, isInitialized, id]);

  const addQuestion = () => {
    const newId = `q-${Date.now()}`;
    setQuestions((prev) => [
      ...prev,
      {
        id: newId,
        question_text: '',
        options: [
          { letter: 'a', text: '', is_correct: true },
          { letter: 'b', text: '', is_correct: false },
        ],
      },
    ]);
  };

  const updateQuestionText = (id: string, text: string) => {
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
        if (q.options.length <= 2) return q;
        const newOptions = q.options.filter((_, idx) => idx !== optionIdx);
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

    if (!id) return;

    // Validate test name
    if (!name.trim()) {
      alert('Enter a test name');
      return;
    }

    // Check for null bytes
    if (name.includes('\0') || description.includes('\0')) {
      alert('Test name or description contains invalid characters. Please remove null bytes.');
      return;
    }

    // Validate question sizes
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      if (q.question_text.includes('\0')) {
        alert(`Question ${i + 1} contains invalid characters (null bytes). Please remove them.`);
        return;
      }

      if (q.question_text.length > 1000000) {
        alert(
          `Question ${i + 1} is too large (${Math.round(q.question_text.length / 1024)}KB).\n\n` +
          'Questions with very large images may fail to save.\n' +
          'Consider using smaller images (under 500KB) or external image URLs.'
        );
        return;
      }

      for (let j = 0; j < q.options.length; j++) {
        const opt = q.options[j];
        if (opt.text.includes('\0')) {
          alert(`Question ${i + 1}, Option ${opt.letter.toUpperCase()} contains invalid characters.`);
          return;
        }
        if (opt.text.length > 100000) {
          alert(`Question ${i + 1}, Option ${opt.letter.toUpperCase()} is too large (${Math.round(opt.text.length / 1024)}KB).`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const testId = parseInt(id);

      // Update test metadata
      await updateTest(run, testId, {
        display_name: name,
        description: description || null,
        group_id: groupId,
        subgroup_id: subgroupId,
        difficulty_level_id: difficultyId,
      });

      // Track which original questions are still present
      const currentOriginalIds = new Set(
        questions.filter((q) => q.originalId).map((q) => q.originalId!)
      );

      // Delete removed questions
      for (const originalId of originalQuestionIds) {
        if (!currentOriginalIds.has(originalId)) {
          await deleteQuestion(run, testId, originalId);
        }
      }

      // Update or create questions
      for (const q of questions) {
        // Skip empty questions
        if (!q.question_text.trim() || !q.options.some((o) => o.text.trim())) {
          continue;
        }

        if (q.originalId) {
          // Update existing question
          await updateQuestion(run, testId, q.originalId, {
            question_text: q.question_text,
          });

          // Delete all existing options for this question and recreate them
          // (simpler than tracking individual option changes)
          await deleteQuestion(run, testId, q.originalId);
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
        } else {
          // Create new question
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
      console.error('Failed to save test:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);

      let userMessage = 'Error saving test:\n\n' + errorMessage;

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

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-flex items-center gap-3 px-6 py-4 bg-slate-800/40 backdrop-blur-xl rounded-xl border border-cyan-500/20">
          <div className="relative w-6 h-6">
            <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-cyan-400 font-mono">Loading test...</p>
        </div>
      </div>
    );
  }

  if (!id || questions.length === 0 && !name) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">Test not found</p>
        <Link to="/tests" className="text-indigo-600 hover:underline">
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white dark:text-white">Edit Test</h1>
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
            <div>
              <label className="block text-sm font-medium mb-1">Group</label>
              <select
                value={groupId ?? ''}
                onChange={(e) => {
                  setGroupId(e.target.value ? parseInt(e.target.value) : null);
                  setSubgroupId(null);
                  setDifficultyId(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="">No Group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subgroup</label>
              <select
                value={subgroupId ?? ''}
                onChange={(e) => setSubgroupId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                disabled={!groupId}
              >
                <option value="">—</option>
                {filteredSubgroups.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Difficulty</label>
              <select
                value={difficultyId ?? ''}
                onChange={(e) => setDifficultyId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                disabled={!groupId}
              >
                <option value="">—</option>
                {filteredDifficulties.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
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
                  <span className="text-sm text-gray-500">
                    Question {qIdx + 1}
                    {q.originalId && <span className="text-xs ml-2">(ID: {q.originalId})</span>}
                  </span>
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
                    onChange={(html) => updateQuestionText(q.id, html)}
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
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link
            to={`/test/${id}/mode`}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
