import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useDB } from '../hooks/useDB';
import { getTestWithQuestions } from '../db/queries/tests';
import { getSessionAnswers, clearSession } from '../db/queries/session';
import { updateStatistics } from '../db/queries/statistics';
import {
  calculateScore,
  getCorrectOptions,
  isMultipleChoice,
  evaluateSingleChoice,
  evaluateMultipleChoice,
} from '../quiz/evaluate';
import type { TestWithQuestions } from '../types/quiz';

interface ResultItem {
  question: TestWithQuestions['questions'][0];
  isCorrect: boolean | null;
  selectedOptions: string[];
}

export default function TestResultsPage() {
  const { id } = useParams<{ id: string }>();
  const { query, run, isInitialized } = useDB();
  const [test, setTest] = useState<TestWithQuestions | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);
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

        if (!testData) return;

        // Compute results from answers
        const answersMap = new Map(sessionAnswers.map((a) => [a.question_index, a]));
        const computedResults = testData.questions.map((q, idx) => {
          const answer = answersMap.get(idx);
          const selected = answer?.answer_json ? JSON.parse(answer.answer_json) as string[] : [];
          const correctOpts = getCorrectOptions(q.options);
          const isMulti = isMultipleChoice(q.options);

          let correct: boolean | null = null;
          if (selected.length > 0) {
            correct = isMulti
              ? evaluateMultipleChoice(selected, correctOpts)
              : evaluateSingleChoice(selected[0], correctOpts[0]);
          }

          return {
            question: q,
            isCorrect: correct,
            selectedOptions: selected,
          };
        });
        setResults(computedResults);

        // Update statistics
        if (sessionAnswers.length > 0) {
          const correctCount = computedResults.filter((r) => r.isCorrect === true).length;
          const totalAnswered = computedResults.filter((r) => r.selectedOptions.length > 0).length;
          const dontKnow = computedResults.filter((r) => r.selectedOptions.length === 0).length;
          await updateStatistics(run, query, parseInt(id!), correctCount, totalAnswered, dontKnow);
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
    setResults([]);
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

  const score = calculateScore(
    results.map((r) => ({ isCorrect: r.isCorrect, status: r.selectedOptions.length > 0 ? 'answered' : 'skipped' }))
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-2 text-center text-gray-900 dark:text-white">{test.display_name}</h1>
      <p className="text-gray-500 text-center mb-6">Results</p>

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
            <div className="text-gray-500">Correct</div>
          </div>
          <div>
            <div className="font-bold text-red-600">{score.incorrect}</div>
            <div className="text-gray-500">Incorrect</div>
          </div>
          <div>
            <div className="font-bold text-yellow-600">{score.dontKnow}</div>
            <div className="text-gray-500">Don't know</div>
          </div>
          <div>
            <div className="font-bold text-gray-500">{score.skipped}</div>
            <div className="text-gray-500">Skipped</div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 justify-center mb-8">
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Take Again
        </button>
        <Link
          to="/tests"
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Back to Tests
        </Link>
      </div>

      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Question Details:</h2>
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
                    {result.selectedOptions.length === 0 ? (
                      <span className="text-gray-400">Skipped</span>
                    ) : (
                      <>
                        <span className="text-gray-500">Your answer: </span>
                        <span
                          className={
                            result.isCorrect ? 'text-green-600' : 'text-red-600'
                          }
                        >
                          {result.selectedOptions.join(', ')}
                        </span>
                      </>
                    )}
                    {!result.isCorrect && (
                      <span className="ml-2 text-green-600">
                        (Correct: {correctOptions.join(', ')})
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
