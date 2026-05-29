import type { TestStatistics } from '../../types/quiz';

type QueryFn = <T>(sql: string) => Promise<T[]>;
type RunFn = (sql: string) => Promise<void>;

export async function getStatistics(
  query: QueryFn,
  testId: number
): Promise<TestStatistics | null> {
  const results = await query<TestStatistics>(`
    SELECT id, test_id, total_attempts, total_correct_answers, total_questions_answered,
           average_score, best_score, last_attempt_date, total_dont_know, created_at, updated_at
    FROM test_statistics
    WHERE test_id = ${testId}
  `);
  return results[0] || null;
}

export async function updateStatistics(
  run: RunFn,
  query: QueryFn,
  testId: number,
  correct: number,
  totalAnswered: number,
  dontKnow: number
): Promise<void> {
  const existing = await getStatistics(query, testId);
  const score = totalAnswered > 0 ? (correct / totalAnswered) * 100 : 0;

  if (existing) {
    const newBestScore = Math.max(existing.best_score, score);
    const newTotalAttempts = existing.total_attempts + 1;
    const newAvgScore = ((existing.average_score * existing.total_attempts) + score) / newTotalAttempts;
    
    await run(`
      UPDATE test_statistics
      SET total_attempts = ${newTotalAttempts},
          total_correct_answers = total_correct_answers + ${correct},
          total_questions_answered = total_questions_answered + ${totalAnswered},
          average_score = ${newAvgScore},
          best_score = ${newBestScore},
          total_dont_know = total_dont_know + ${dontKnow},
          last_attempt_date = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE test_id = ${testId}
    `);
  } else {
    await run(`
      INSERT INTO test_statistics (test_id, total_attempts, total_correct_answers, total_questions_answered, average_score, best_score, last_attempt_date, total_dont_know)
      VALUES (${testId}, 1, ${correct}, ${totalAnswered}, ${score}, ${score}, CURRENT_TIMESTAMP, ${dontKnow})
    `);
  }
}

export async function getAllStatistics(query: QueryFn): Promise<TestStatistics[]> {
  return query<TestStatistics>(`
    SELECT id, test_id, total_attempts, total_correct_answers, total_questions_answered,
           average_score, best_score, last_attempt_date, total_dont_know, created_at, updated_at
    FROM test_statistics
  `);
}
