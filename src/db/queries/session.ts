import type { SessionAnswer } from '../../types/quiz';

type QueryFn = <T>(sql: string) => Promise<T[]>;
type RunFn = (sql: string) => Promise<void>;

export async function saveSessionAnswer(
  run: RunFn,
  testId: number,
  questionId: number,
  selectedOptions: string[],
  isCorrect: boolean | null,
  status: 'answered' | 'skipped' | 'dont_know'
): Promise<void> {
  const optionsJson = JSON.stringify(selectedOptions);
  const correctVal = isCorrect === null ? 'NULL' : isCorrect ? 'TRUE' : 'FALSE';

  // Delete existing answer first
  await run(`
    DELETE FROM session_answers 
    WHERE test_id = ${testId} AND question_id = ${questionId}
  `);

  await run(`
    INSERT INTO session_answers (test_id, question_id, selected_options, is_correct, status)
    VALUES (${testId}, ${questionId}, '${optionsJson}', ${correctVal}, '${status}')
  `);
}

export async function getSessionAnswers(
  query: QueryFn,
  testId: number
): Promise<SessionAnswer[]> {
  return query<SessionAnswer>(`
    SELECT id, test_id, question_id, selected_options, is_correct, status, answered_at
    FROM session_answers
    WHERE test_id = ${testId}
    ORDER BY question_id
  `);
}

export async function clearSession(run: RunFn, testId: number): Promise<void> {
  await run(`DELETE FROM session_answers WHERE test_id = ${testId}`);
}

export async function resetMistakesOnly(run: RunFn, testId: number): Promise<void> {
  await run(`
    DELETE FROM session_answers 
    WHERE test_id = ${testId} 
    AND (is_correct = FALSE OR status = 'dont_know')
  `);
}

export async function getSessionProgress(
  query: QueryFn,
  testId: number
): Promise<{
  total: number;
  answered: number;
  correct: number;
  incorrect: number;
  skipped: number;
  dontKnow: number;
}> {
  const answers = await getSessionAnswers(query, testId);

  return {
    total: answers.length,
    answered: answers.filter((a) => a.status === 'answered').length,
    correct: answers.filter((a) => a.is_correct === true).length,
    incorrect: answers.filter((a) => a.is_correct === false).length,
    skipped: answers.filter((a) => a.status === 'skipped').length,
    dontKnow: answers.filter((a) => a.status === 'dont_know').length,
  };
}
