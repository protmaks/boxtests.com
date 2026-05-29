import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useDB } from '../hooks/useDB';
import { getTestWithQuestions } from '../db/queries/tests';
import { saveSessionAnswer, clearSession } from '../db/queries/session';
import { QuestionCard } from '../components/QuestionCard';
import { OptionList } from '../components/OptionList';
import { ProgressBar } from '../components/ProgressBar';
import { isMultipleChoice } from '../quiz/evaluate';
import type { TestWithQuestions } from '../types/quiz';

type AnswerState = {
  selectedOptions: string[];
  isDontKnow: boolean;
};

export default function TestSinglePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { query, run, isInitialized } = useDB();

  const [test, setTest] = useState<TestWithQuestions | null>(null);
  const [answers, setAnswers] = useState<Map<number, AnswerState>>(new Map());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isInitialized || !id) return;

    async function loadData() {
      try {
        const testData = await getTestWithQuestions(query, parseInt(id!));
        setTest(testData);
        // Clear any previous session for fresh start
        await clearSession(run, parseInt(id!));
      } catch (err) {
        console.error('Failed to load test:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, query, run, isInitialized]);

  const handleSelect = (questionId: number, optionLetter: string, isMultiple: boolean) => {
    setAnswers((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(questionId) || { selectedOptions: [], isDontKnow: false };
      
      if (isMultiple) {
        const options = current.selectedOptions.includes(optionLetter)
          ? current.selectedOptions.filter((o) => o !== optionLetter)
          : [...current.selectedOptions, optionLetter];
        newMap.set(questionId, { selectedOptions: options, isDontKnow: false });
      } else {
        newMap.set(questionId, { selectedOptions: [optionLetter], isDontKnow: false });
      }
      
      return newMap;
    });
  };

  const handleDontKnow = (questionId: number) => {
    setAnswers((prev) => {
      const newMap = new Map(prev);
      newMap.set(questionId, { selectedOptions: [], isDontKnow: true });
      return newMap;
    });
  };

  const handleSubmit = async () => {
    if (!test || !id) return;
    setSubmitting(true);

    try {
      for (let idx = 0; idx < test.questions.length; idx++) {
        const question = test.questions[idx];
        const answer = answers.get(question.id);
        const selectedOptions = answer?.selectedOptions || [];

        await saveSessionAnswer(run, parseInt(id), idx, selectedOptions);
      }

      navigate(`/test/${id}/results`);
    } catch (err) {
      console.error('Failed to submit test:', err);
      alert('Error saving results');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!test || test.questions.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Test not found or has no questions</p>
        <Link to="/tests" className="text-indigo-600 hover:underline">
          Back to list
        </Link>
      </div>
    );
  }

  const answeredCount = Array.from(answers.values()).filter(
    (a) => a.selectedOptions.length > 0 || a.isDontKnow
  ).length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="sticky top-0 bg-gray-50 dark:bg-gray-900 py-4 z-10">
        <h1 className="text-xl font-bold mb-2">{test.display_name}</h1>
        <ProgressBar current={answeredCount} total={test.questions.length} />
      </div>

      <div className="space-y-6 mt-4">
        {test.questions.map((question, index) => {
          const isMultiple = isMultipleChoice(question.options);
          const answer = answers.get(question.id);

          return (
            <QuestionCard
              key={question.id}
              questionNumber={index + 1}
              totalQuestions={test.questions.length}
              questionText={question.question_text}
            >
              <OptionList
                options={question.options}
                selectedOptions={answer?.selectedOptions || []}
                onSelect={(letter) => handleSelect(question.id, letter, isMultiple)}
                isMultiple={isMultiple}
                showDontKnow
                onDontKnow={() => handleDontKnow(question.id)}
                isDontKnowSelected={answer?.isDontKnow || false}
              />
            </QuestionCard>
          );
        })}
      </div>

      <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 py-4 mt-6 flex justify-between items-center">
        <Link to={`/test/${id}/mode`} className="text-indigo-600 hover:underline">
          ← Choose another mode
        </Link>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {submitting ? 'Checking...' : 'Finish Test'}
        </button>
      </div>
    </div>
  );
}
