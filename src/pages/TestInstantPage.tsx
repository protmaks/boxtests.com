import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useDB } from '../hooks/useDB';
import { getTestWithQuestions } from '../db/queries/tests';
import { saveSessionAnswer, getSessionAnswers } from '../db/queries/session';
import { QuestionCard } from '../components/QuestionCard';
import { OptionList } from '../components/OptionList';
import { ProgressBar } from '../components/ProgressBar';
import { InstantStats } from '../components/InstantStats';
import { ExplanationBox } from '../components/ExplanationBox';
import {
  isMultipleChoice,
  getCorrectOptions,
  evaluateSingleChoice,
  evaluateMultipleChoice,
} from '../quiz/evaluate';
import type { TestWithQuestions, SessionAnswer } from '../types/quiz';

export default function TestInstantPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { query, run, isInitialized } = useDB();

  const [test, setTest] = useState<TestWithQuestions | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isDontKnow, setIsDontKnow] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [sessionAnswers, setSessionAnswers] = useState<Map<number, SessionAnswer>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isInitialized || !id) return;

    async function loadData() {
      try {
        const testData = await getTestWithQuestions(query, parseInt(id!));
        if (!testData) return;
        setTest(testData);

        const answers = await getSessionAnswers(query, parseInt(id!));
        const answersMap = new Map(answers.map((a) => [a.question_id, a]));
        setSessionAnswers(answersMap);

        // Find first unanswered question
        const firstUnanswered = testData.questions.findIndex(
          (q) => !answersMap.has(q.id)
        );
        if (firstUnanswered >= 0) {
          setCurrentIndex(firstUnanswered);
        }
      } catch (err) {
        console.error('Failed to load test:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, query, isInitialized]);

  const currentQuestion = test?.questions[currentIndex];
  const isMultiple = currentQuestion ? isMultipleChoice(currentQuestion.options) : false;

  const stats = {
    correct: Array.from(sessionAnswers.values()).filter((a) => a.is_correct === true).length,
    incorrect: Array.from(sessionAnswers.values()).filter((a) => a.is_correct === false).length,
    dontKnow: Array.from(sessionAnswers.values()).filter((a) => a.status === 'dont_know').length,
    unanswered: test ? test.questions.length - sessionAnswers.size : 0,
  };

  // Check if current question was already answered
  useEffect(() => {
    if (!currentQuestion) return;
    const existingAnswer = sessionAnswers.get(currentQuestion.id);
    if (existingAnswer) {
      setIsAnswered(true);
      setIsCorrect(existingAnswer.is_correct);
      setSelectedOptions(JSON.parse(existingAnswer.selected_options));
      setIsDontKnow(existingAnswer.status === 'dont_know');
    } else {
      setIsAnswered(false);
      setIsCorrect(null);
      setSelectedOptions([]);
      setIsDontKnow(false);
    }
  }, [currentIndex, currentQuestion, sessionAnswers]);

  const handleSelect = (optionLetter: string) => {
    if (isAnswered) return;
    setIsDontKnow(false);
    if (isMultiple) {
      setSelectedOptions((prev) =>
        prev.includes(optionLetter)
          ? prev.filter((o) => o !== optionLetter)
          : [...prev, optionLetter]
      );
    } else {
      setSelectedOptions([optionLetter]);
    }
  };

  const handleDontKnow = () => {
    if (isAnswered) return;
    setIsDontKnow(true);
    setSelectedOptions([]);
  };

  const handleSubmit = async () => {
    if (!currentQuestion || !id) return;

    const correctOptions = getCorrectOptions(currentQuestion.options);
    let correct: boolean | null = null;
    let status: 'answered' | 'dont_know' = 'answered';

    if (isDontKnow) {
      status = 'dont_know';
      correct = null;
    } else if (selectedOptions.length > 0) {
      correct = isMultiple
        ? evaluateMultipleChoice(selectedOptions, correctOptions)
        : evaluateSingleChoice(selectedOptions[0], correctOptions[0]);
    }

    await saveSessionAnswer(run, parseInt(id), currentQuestion.id, selectedOptions, correct, status);

    setIsAnswered(true);
    setIsCorrect(correct);

    // Update local state
    setSessionAnswers((prev) => {
      const newMap = new Map(prev);
      newMap.set(currentQuestion.id, {
        id: 0,
        test_id: parseInt(id),
        question_id: currentQuestion.id,
        selected_options: JSON.stringify(selectedOptions),
        is_correct: correct,
        status,
        answered_at: new Date().toISOString(),
      });
      return newMap;
    });
  };

  const handleNext = () => {
    if (test && currentIndex < test.questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleFinish = () => {
    navigate(`/test/${id}/results`);
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!test || !currentQuestion) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Тест не найден или не содержит вопросов</p>
        <Link to="/tests" className="text-indigo-600 hover:underline">
          Вернуться к списку
        </Link>
      </div>
    );
  }

  const canSubmit = !isAnswered && (selectedOptions.length > 0 || isDontKnow);
  const isLast = currentIndex === test.questions.length - 1;
  const allAnswered = sessionAnswers.size === test.questions.length;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-4">
        <h1 className="text-xl font-bold mb-2">{test.display_name}</h1>
        <ProgressBar current={sessionAnswers.size} total={test.questions.length} />
      </div>

      <InstantStats {...stats} />

      <div className="mt-6">
        <QuestionCard
          questionNumber={currentIndex + 1}
          totalQuestions={test.questions.length}
          questionText={currentQuestion.question_text}
        >
          <OptionList
            options={currentQuestion.options}
            selectedOptions={selectedOptions}
            onSelect={handleSelect}
            isMultiple={isMultiple}
            disabled={isAnswered}
            showCorrect={isAnswered}
            showDontKnow={!isAnswered}
            onDontKnow={handleDontKnow}
            isDontKnowSelected={isDontKnow}
          />

          {isAnswered && (
            <div
              className={`mt-4 p-3 rounded-lg text-center ${
                isCorrect === true
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : isCorrect === false
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
              }`}
            >
              {isCorrect === true
                ? '✓ Правильно!'
                : isCorrect === false
                ? '✗ Неправильно'
                : '? Не знаю'}
            </div>
          )}

          <ExplanationBox explanation={currentQuestion.explanation} isVisible={isAnswered} />
        </QuestionCard>
      </div>

      <div className="mt-6 flex justify-between items-center">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50"
        >
          ← Назад
        </button>

        <div className="flex gap-2">
          {!isAnswered && (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Проверить
            </button>
          )}

          {isAnswered && !isLast && (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Далее →
            </button>
          )}

          {(isLast || allAnswered) && (
            <button
              onClick={handleFinish}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Завершить
            </button>
          )}
        </div>

        <button
          onClick={handleNext}
          disabled={isLast}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50"
        >
          Далее →
        </button>
      </div>

      <div className="mt-4 text-center">
        <Link to={`/test/${id}/mode`} className="text-indigo-600 hover:underline text-sm">
          Выбрать другой режим
        </Link>
      </div>
    </div>
  );
}
