import type { QuestionOption } from '../types/quiz';

export function evaluateSingleChoice(
  userAnswer: string | null,
  correctOption: string
): boolean {
  return userAnswer === correctOption;
}

export function evaluateMultipleChoice(
  userAnswers: string[],
  correctOptions: string[]
): boolean {
  if (userAnswers.length !== correctOptions.length) return false;
  const sortedUser = [...userAnswers].sort();
  const sortedCorrect = [...correctOptions].sort();
  return sortedUser.every((ans, i) => ans === sortedCorrect[i]);
}

export function getCorrectOptions(options: QuestionOption[]): string[] {
  return options.filter((o) => o.is_correct).map((o) => o.option_letter);
}

export function isMultipleChoice(options: QuestionOption[]): boolean {
  return options.filter((o) => o.is_correct).length > 1;
}

export function calculateScore(
  answers: { isCorrect: boolean | null; status: string }[]
): {
  total: number;
  answered: number;
  correct: number;
  incorrect: number;
  skipped: number;
  dontKnow: number;
  percentage: number;
} {
  const total = answers.length;
  const answered = answers.filter((a) => a.status === 'answered').length;
  const correct = answers.filter((a) => a.isCorrect === true).length;
  const incorrect = answers.filter((a) => a.isCorrect === false).length;
  const skipped = answers.filter((a) => a.status === 'skipped').length;
  const dontKnow = answers.filter((a) => a.status === 'dont_know').length;
  
  const gradable = answered - dontKnow;
  const percentage = gradable > 0 ? Math.round((correct / gradable) * 100) : 0;

  return { total, answered, correct, incorrect, skipped, dontKnow, percentage };
}
