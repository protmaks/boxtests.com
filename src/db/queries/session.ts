import type { SessionAnswer } from '../../types/quiz';

type QueryFn = <T>(sql: string) => Promise<T[]>;
type RunFn = (sql: string) => Promise<void>;

export async function saveSessionAnswer(
  run: RunFn,
  testId: number,
  questionIndex: number,
  selectedOptions: string[]
): Promise<void> {
  const answerJson = JSON.stringify(selectedOptions);

  await run(`
    INSERT INTO test_current_session (test_id, question_index, answer_json, is_answered)
    VALUES (${testId}, ${questionIndex}, '${answerJson}', TRUE)
    ON CONFLICT (test_id, question_index) DO UPDATE SET
      answer_json = '${answerJson}',
      is_answered = TRUE
  `);
}

export async function getSessionAnswers(
  query: QueryFn,
  testId: number
): Promise<SessionAnswer[]> {
  return query<SessionAnswer>(`
    SELECT test_id, question_index, answer_json, is_answered
    FROM test_current_session
    WHERE test_id = ${testId}
    ORDER BY question_index
  `);
}

export async function clearSession(run: RunFn, testId: number): Promise<void> {
  await run(`DELETE FROM test_current_session WHERE test_id = ${testId}`);
}

export async function clearIncorrectAnswers(
  run: RunFn,
  testId: number,
  questionIndexes: number[]
): Promise<void> {
  if (questionIndexes.length === 0) return;
  
  const indexes = questionIndexes.join(',');
  await run(`
    DELETE FROM test_current_session 
    WHERE test_id = ${testId} 
    AND question_index IN (${indexes})
  `);
}

export async function clearDontKnowAnswers(
  run: RunFn,
  testId: number
): Promise<void> {
  await run(`
    DELETE FROM test_current_session 
    WHERE test_id = ${testId} 
    AND (answer_json = '[]' OR answer_json IS NULL OR is_answered = FALSE)
  `);
}

export async function getSessionProgress(
  query: QueryFn,
  testId: number
): Promise<{ answered: number }> {
  const answers = await getSessionAnswers(query, testId);
  return {
    answered: answers.filter((a) => a.is_answered).length,
  };
}
