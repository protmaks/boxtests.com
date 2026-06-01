import { Link, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useDB } from '../hooks/useDB';
import { getTestById } from '../db/queries/tests';
import { clearSession, clearIncorrectAnswers, clearDontKnowAnswers, getSessionAnswers } from '../db/queries/session';
import { getTestWithQuestions } from '../db/queries/tests';
import { getCorrectOptions, evaluateSingleChoice, evaluateMultipleChoice, isMultipleChoice } from '../quiz/evaluate';
import type { Test } from '../types/quiz';

interface ProgressStats {
  answered: number;
  correct: number;
  incorrect: number;
  dontKnow: number;
  pending: number;
}

export default function TestModeSelector() {
  const { id } = useParams<{ id: string }>();
  const { query, run, isInitialized } = useDB();
  const [test, setTest] = useState<Test | null>(null);
  const [progress, setProgress] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isInitialized || !id) return;

    async function loadData() {
      try {
        const [testData, testWithQuestions, sessionAnswers] = await Promise.all([
          getTestById(query, parseInt(id!)),
          getTestWithQuestions(query, parseInt(id!)),
          getSessionAnswers(query, parseInt(id!)),
        ]);
        
        setTest(testData);

        // Calculate detailed statistics
        if (testWithQuestions) {
          const answersMap = new Map(sessionAnswers.map((a) => [a.question_index, a]));
          let correct = 0;
          let incorrect = 0;
          let dontKnow = 0;
          
          testWithQuestions.questions.forEach((q, idx) => {
            const answer = answersMap.get(idx);
            if (!answer || !answer.answer_json) {
              return; // Not answered yet
            }
            
            const selected = JSON.parse(answer.answer_json) as string[];
            
            if (selected.length === 0) {
              dontKnow++;
            } else {
              const correctOpts = getCorrectOptions(q.options);
              const isMulti = isMultipleChoice(q.options);
              
              const isCorrect = isMulti
                ? evaluateMultipleChoice(selected, correctOpts)
                : evaluateSingleChoice(selected[0], correctOpts[0]);
              
              if (isCorrect) {
                correct++;
              } else {
                incorrect++;
              }
            }
          });
          
          const answered = sessionAnswers.length;
          const pending = testWithQuestions.questions.length - answered;
          
          setProgress({ answered, correct, incorrect, dontKnow, pending });
        }
      } catch (err) {
        console.error('Failed to load test:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, query, isInitialized]);

  const loadProgressStats = async (): Promise<ProgressStats | null> => {
    if (!id) return null;
    
    try {
      const [testWithQuestions, sessionAnswers] = await Promise.all([
        getTestWithQuestions(query, parseInt(id)),
        getSessionAnswers(query, parseInt(id)),
      ]);

      if (!testWithQuestions) return null;

      const answersMap = new Map(sessionAnswers.map((a) => [a.question_index, a]));
      let correct = 0;
      let incorrect = 0;
      let dontKnow = 0;
      
      testWithQuestions.questions.forEach((q, idx) => {
        const answer = answersMap.get(idx);
        if (!answer || !answer.answer_json) {
          return;
        }
        
        const selected = JSON.parse(answer.answer_json) as string[];
        
        if (selected.length === 0) {
          dontKnow++;
        } else {
          const correctOpts = getCorrectOptions(q.options);
          const isMulti = isMultipleChoice(q.options);
          
          const isCorrect = isMulti
            ? evaluateMultipleChoice(selected, correctOpts)
            : evaluateSingleChoice(selected[0], correctOpts[0]);
          
          if (isCorrect) {
            correct++;
          } else {
            incorrect++;
          }
        }
      });
      
      const answered = sessionAnswers.length;
      const pending = testWithQuestions.questions.length - answered;
      
      return { answered, correct, incorrect, dontKnow, pending };
    } catch (err) {
      console.error('Failed to load progress stats:', err);
      return null;
    }
  };

  const handleReset = async () => {
    if (!id) return;
    await clearSession(run, parseInt(id));
    const newProgress = await loadProgressStats();
    setProgress(newProgress);
  };

  const handleResetIncorrect = async () => {
    if (!id) return;
    
    try {
      // Get test with questions and session answers
      const [testData, sessionAnswers] = await Promise.all([
        getTestWithQuestions(query, parseInt(id)),
        getSessionAnswers(query, parseInt(id)),
      ]);

      if (!testData) return;

      // Find incorrect answer indexes
      const answersMap = new Map(sessionAnswers.map((a) => [a.question_index, a]));
      const incorrectIndexes: number[] = [];

      testData.questions.forEach((q, idx) => {
        const answer = answersMap.get(idx);
        if (!answer || !answer.answer_json) return;
        
        const selected = JSON.parse(answer.answer_json) as string[];
        if (selected.length === 0) return; // Skip unanswered
        
        const correctOpts = getCorrectOptions(q.options);
        const isMulti = isMultipleChoice(q.options);
        
        const isCorrect = isMulti
          ? evaluateMultipleChoice(selected, correctOpts)
          : evaluateSingleChoice(selected[0], correctOpts[0]);
        
        if (!isCorrect) {
          incorrectIndexes.push(idx);
        }
      });

      // Clear incorrect answers
      await clearIncorrectAnswers(run, parseInt(id), incorrectIndexes);
      
      // Reload progress
      const newProgress = await loadProgressStats();
      setProgress(newProgress);
    } catch (err) {
      console.error('Failed to reset incorrect answers:', err);
    }
  };

  const handleResetDontKnow = async () => {
    if (!id) return;
    await clearDontKnowAnswers(run, parseInt(id));
    const newProgress = await loadProgressStats();
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
        <p className="text-red-500">Test not found</p>
        <Link to="/tests" className="text-indigo-600 hover:underline">
          Back to list
        </Link>
      </div>
    );
  }

  const hasProgress = progress && progress.answered > 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-white">{test.display_name}</h1>
        <Link
          to={`/test/${id}/edit`}
          className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
        >
          Edit Test
        </Link>
      </div>
      {test.description && (
        <p className="text-gray-400 dark:text-white mb-6">{test.description}</p>
      )}

      {hasProgress && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
          <div className="flex items-start justify-between gap-6 mb-3">
            <p className="text-blue-800 dark:text-blue-300">
              You have progress in this test: {progress.answered} questions answered
            </p>
            <div className="flex gap-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-green-600">{progress.correct}</div>
                <div className="text-gray-600 dark:text-gray-400">Correct</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-red-600">{progress.incorrect}</div>
                <div className="text-gray-600 dark:text-gray-400">Incorrect</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-yellow-600">{progress.dontKnow}</div>
                <div className="text-gray-600 dark:text-gray-400">Unknown</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-500">{progress.pending}</div>
                <div className="text-gray-600 dark:text-gray-400">Pending</div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              Reset All
            </button>
            <button
              onClick={handleResetIncorrect}
              className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Reset Incorrect
            </button>
            <button
              onClick={handleResetDontKnow}
              className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Reset "Don't Know"
            </button>
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold mb-4 text-white">Choose Mode:</h2>
      <div className="grid gap-4">
        <Link
          to={`/test/${id}`}
          className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">📄 Single Page Mode</h3>
          <p className="text-gray-600 dark:text-gray-400">
            All questions on one page. Results after submitting all answers.
          </p>
        </Link>
        <Link
          to={`/test/${id}/instant`}
          className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">⚡ Instant Mode</h3>
          <p className="text-gray-600 dark:text-gray-400">
            One question at a time. Immediate feedback after each answer.
            {hasProgress && ' Continue where you left off.'}
          </p>
        </Link>
      </div>
      <div className="mt-6 text-center">
        <Link to="/tests" className="text-blue-400 hover:text-blue-300 hover:underline">
          ← Back to list
        </Link>
      </div>
    </div>
  );
}
