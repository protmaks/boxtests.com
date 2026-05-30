import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useDB } from '../hooks/useDB';
import { getTestWithQuestions } from '../db/queries/tests';
import { saveSessionAnswer, getSessionAnswers } from '../db/queries/session';
import { QuestionCard } from '../components/QuestionCard';
import { OptionList } from '../components/OptionList';
import { ProgressBar } from '../components/ProgressBar';
import { InstantStats } from '../components/InstantStats';
import { QuestionNav } from '../components/QuestionNav';
import { ExplanationBox } from '../components/ExplanationBox';
import {
  isMultipleChoice,
  getCorrectOptions,
  evaluateSingleChoice,
  evaluateMultipleChoice,
} from '../quiz/evaluate';
import type { TestWithQuestions } from '../types/quiz';

interface AnswerState {
  selectedOptions: string[];
  isCorrect: boolean | null;
}

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
  const [answerStates, setAnswerStates] = useState<Map<number, AnswerState>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isInitialized || !id) return;

    async function loadData() {
      try {
        const testData = await getTestWithQuestions(query, parseInt(id!));
        if (!testData) return;
        setTest(testData);

        const answers = await getSessionAnswers(query, parseInt(id!));
        const statesMap = new Map<number, AnswerState>();
        
        for (const answer of answers) {
          const question = testData.questions[answer.question_index];
          if (!question) continue;
          
          const selected = answer.answer_json ? JSON.parse(answer.answer_json) as string[] : [];
          const correctOpts = getCorrectOptions(question.options);
          const isMulti = isMultipleChoice(question.options);
          
          let correct: boolean | null = null;
          if (selected.length > 0) {
            correct = isMulti
              ? evaluateMultipleChoice(selected, correctOpts)
              : evaluateSingleChoice(selected[0], correctOpts[0]);
          }
          
          statesMap.set(answer.question_index, { selectedOptions: selected, isCorrect: correct });
        }
        
        setAnswerStates(statesMap);

        // Find first unanswered question
        const firstUnanswered = testData.questions.findIndex(
          (_, idx) => !statesMap.has(idx)
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
    correct: Array.from(answerStates.values()).filter((a) => a.isCorrect === true).length,
    incorrect: Array.from(answerStates.values()).filter((a) => a.isCorrect === false).length,
    dontKnow: Array.from(answerStates.values()).filter((a) => a.selectedOptions.length === 0).length,
    unanswered: test ? test.questions.length - answerStates.size : 0,
  };

  // Check if current question was already answered
  useEffect(() => {
    if (!currentQuestion) return;
    const existingAnswer = answerStates.get(currentIndex);
    if (existingAnswer) {
      setIsAnswered(true);
      setIsCorrect(existingAnswer.isCorrect);
      setSelectedOptions(existingAnswer.selectedOptions);
      setIsDontKnow(existingAnswer.selectedOptions.length === 0);
    } else {
      setIsAnswered(false);
      setIsCorrect(null);
      setSelectedOptions([]);
      setIsDontKnow(false);
    }
  }, [currentIndex, currentQuestion, answerStates]);

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

    if (isDontKnow) {
      correct = null;
    } else if (selectedOptions.length > 0) {
      correct = isMultiple
        ? evaluateMultipleChoice(selectedOptions, correctOptions)
        : evaluateSingleChoice(selectedOptions[0], correctOptions[0]);
    }

    await saveSessionAnswer(run, parseInt(id), currentIndex, selectedOptions);

    setIsAnswered(true);
    setIsCorrect(correct);

    // Update local state
    setAnswerStates((prev) => {
      const newMap = new Map(prev);
      newMap.set(currentIndex, {
        selectedOptions,
        isCorrect: correct,
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
        <p className="text-red-500">Test not found or has no questions</p>
        <Link to="/tests" className="text-indigo-600 hover:underline">
          Back to list
        </Link>
      </div>
    );
  }

  const canSubmit = !isAnswered && (selectedOptions.length > 0 || isDontKnow);
  const isLast = currentIndex === test.questions.length - 1;
  const allAnswered = answerStates.size === test.questions.length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-white">{test.display_name}</h1>
          <InstantStats {...stats} />
        </div>
        <ProgressBar current={answerStates.size} total={test.questions.length} />
      </div>

      <QuestionNav
        total={test.questions.length}
        currentIndex={currentIndex}
        answerStates={answerStates}
        onSelect={setCurrentIndex}
      />

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
                ? '✓ Correct!'
                : isCorrect === false
                ? '✗ Incorrect'
                : '? Don\'t know'}
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
          ← Back
        </button>

        <div className="flex gap-2">
          {!isAnswered && (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Check
            </button>
          )}

          {isAnswered && !isLast && (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Next →
            </button>
          )}

          {(isLast || allAnswered) && (
            <button
              onClick={handleFinish}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Finish
            </button>
          )}
        </div>

        <button
          onClick={handleNext}
          disabled={isLast}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50"
        >
          Next →
        </button>
      </div>

      <div className="mt-4 text-center">
        <Link to={`/test/${id}/mode`} className="text-indigo-600 hover:underline text-sm">
          Choose another mode
        </Link>
      </div>
    </div>
  );
}
