import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useDB } from '../hooks/useDB';
import { getTestWithQuestions } from '../db/queries/tests';
import { getSessionAnswers, clearSession } from '../db/queries/session';
import { updateStatistics } from '../db/queries/statistics';
import { calculateScore, getCorrectOptions } from '../quiz/evaluate';
import type { TestWithQuestions, SessionAnswer } from '../types/quiz';

export default function TestResultsPage() {
  const { id } = useParams<{ id: string }>();
  const { query, run, isInitialized } = useDB();
  const [test, setTest] = useState<TestWithQuestions | null>(null);
  const [answers, setAnswers] = useState<SessionAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isInitialized || !id) return;

    async function loadData() {
      try {
        const [testData, sessionAnswers] = await Promise.all([
          getTestWithQuestions(query, parseInt(id!)),
          getSessionAnswers(query, parseInt(id!)),
        ]);
        setTest(testData);
        setAnswers(sessionAnswers);

        // Update statistics
        if (testData && sessionAnswers.length > 0) {
          const correct = sessionAnswers.filter((a) => a.is_correct === true).length;
          const incorrect = sessionAnswers.filter((a) => a.is_correct === false).length;
          const skipped = sessionAnswers.filter((a) => a.status === 'dont_know').length;
          await updateStatistics(run, query, parseInt(id!), correct, incorrect, skipped);
        }
      } catch (err) {
        console.error('Failed to load results:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, query, run, isInitialized]);

  const handleReset = async () => {
    if (!id) return;
    await clearSession(run, parseInt(id));
    setAnswers([]);
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

  const answersMap = new Map(answers.map((a) => [a.question_id, a]));
  const results = test.questions.map((q) => {
    const answer = answersMap.get(q.id);
    return {
      question: q,
      isCorrect: answer?.is_correct ?? null,
      status: answer?.status ?? 'skipped',
      selectedOptions: answer ? JSON.parse(answer.selected_options) as string[] : [],
    };
  });

  const score = calculateScore(
    results.map((r) => ({ isCorrect: r.isCorrect, status: r.status }))
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2 text-center">{test.display_name}</h1>
      <p className="text-gray-500 text-center mb-6">Результаты</p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center mb-6">
        <div
          className={`text-6xl font-bold mb-4 ${
            score.percentage >= 70
              ? 'text-green-600'
              : score.percentage >= 50
              ? 'text-yellow-600'
              : 'text-red-600'
          }`}
        >
          {score.percentage}%
        </div>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-bold text-green-600">{score.correct}</div>
            <div className="text-gray-500">Правильно</div>
          </div>
          <div>
            <div className="font-bold text-red-600">{score.incorrect}</div>
            <div className="text-gray-500">Неправильно</div>
          </div>
          <div>
            <div className="font-bold text-yellow-600">{score.dontKnow}</div>
            <div className="text-gray-500">Не знаю</div>
          </div>
          <div>
            <div className="font-bold text-gray-500">{score.skipped}</div>
            <div className="text-gray-500">Пропущено</div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 justify-center mb-8">
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Пройти снова
        </button>
        <Link
          to="/tests"
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          К списку тестов
        </Link>
      </div>

      <h2 className="text-xl font-bold mb-4">Детализация по вопросам:</h2>
      <div className="space-y-4">
        {results.map((result, index) => {
          const correctOptions = getCorrectOptions(result.question.options);
          return (
            <div
              key={result.question.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 ${
                result.isCorrect === true
                  ? 'border-green-500'
                  : result.isCorrect === false
                  ? 'border-red-500'
                  : 'border-yellow-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                    result.isCorrect === true
                      ? 'bg-green-500'
                      : result.isCorrect === false
                      ? 'bg-red-500'
                      : 'bg-yellow-500'
                  }`}
                >
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div
                    className="prose dark:prose-invert prose-sm max-w-none mb-2"
                    dangerouslySetInnerHTML={{ __html: result.question.question_text }}
                  />
                  <div className="text-sm">
                    {result.status === 'dont_know' ? (
                      <span className="text-yellow-600">Не знаю</span>
                    ) : result.selectedOptions.length > 0 ? (
                      <>
                        <span className="text-gray-500">Ваш ответ: </span>
                        <span
                          className={
                            result.isCorrect ? 'text-green-600' : 'text-red-600'
                          }
                        >
                          {result.selectedOptions.join(', ')}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-400">Пропущено</span>
                    )}
                    {!result.isCorrect && (
                      <span className="ml-2 text-green-600">
                        (Правильно: {correctOptions.join(', ')})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
