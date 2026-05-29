import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useDB } from '../hooks/useDB';
import { getAllGroups, getAllSubgroups, getAllDifficultyLevels } from '../db/queries/groups';
import { createTest } from '../db/mutations/tests';
import { createQuestion } from '../db/mutations/questions';
import type { TestGroup, TestSubgroup, DifficultyLevel } from '../types/quiz';

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

  useEffect(() => {
    if (!isInitialized) return;

    async function loadData() {
      const [g, s, d] = await Promise.all([
        getAllGroups(query),
        getAllSubgroups(query),
        getAllDifficultyLevels(query),
      ]);
      setGroups(g);
      setSubgroups(s);
      setDifficulties(d);
    }

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

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Введите название теста');
      return;
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
      alert('Ошибка при создании теста');
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
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Создание теста</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Название теста *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="Введите название"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              rows={3}
              placeholder="Описание теста"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Группа</label>
              <select
                value={groupId ?? ''}
                onChange={(e) => {
                  setGroupId(e.target.value ? parseInt(e.target.value) : null);
                  setSubgroupId(null);
                  setDifficultyId(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="">Без группы</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Подгруппа</label>
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
              <label className="block text-sm font-medium mb-1">Сложность</label>
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
            <h2 className="text-lg font-semibold">Вопросы ({questions.length})</h2>
            <button
              type="button"
              onClick={addQuestion}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              + Добавить вопрос
            </button>
          </div>

          <div className="space-y-4">
            {questions.map((q, qIdx) => (
              <div key={q.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm text-gray-500">Вопрос {qIdx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeQuestion(q.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
                <textarea
                  value={q.question_text}
                  onChange={(e) => updateQuestion(q.id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 mb-3"
                  rows={2}
                  placeholder="Текст вопроса"
                />
                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => (
                    <div key={opt.letter} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={opt.is_correct}
                        onChange={(e) => updateOption(q.id, optIdx, 'is_correct', e.target.checked)}
                        className="w-5 h-5"
                        title="Правильный ответ"
                      />
                      <span className="w-6 text-center font-medium">{opt.letter.toUpperCase()}</span>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => updateOption(q.id, optIdx, 'text', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        placeholder={`Вариант ${opt.letter.toUpperCase()}`}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addOption(q.id)}
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    + Добавить вариант
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
            {saving ? 'Сохранение...' : 'Создать тест'}
          </button>
          <Link
            to="/tests"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}
