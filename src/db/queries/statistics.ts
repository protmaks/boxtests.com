import type { TestStatistics } from '../../types/quiz';

type QueryFn = <T>(sql: string) => Promise<T[]>;
type RunFn = (sql: string) => Promise<void>;

export async function getStatistics(
  query: QueryFn,
  testId: number
): Promise<TestStatistics | null> {
  const results = await query<TestStatistics>(`
    SELECT id, test_id, total_attempts, total_correct, total_incorrect,
           total_skipped, last_attempt_at
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
  incorrect: number,
  skipped: number
): Promise<void> {
  const existing = await getStatistics(query, testId);

  if (existing) {
    await run(`
      UPDATE test_statistics
      SET total_attempts = total_attempts + 1,
          total_correct = total_correct + ${correct},
          total_incorrect = total_incorrect + ${incorrect},
          total_skipped = total_skipped + ${skipped},
          last_attempt_at = CURRENT_TIMESTAMP
      WHERE test_id = ${testId}
    `);
  } else {
    await run(`
      INSERT INTO test_statistics (test_id, total_attempts, total_correct, total_incorrect, total_skipped, last_attempt_at)
      VALUES (${testId}, 1, ${correct}, ${incorrect}, ${skipped}, CURRENT_TIMESTAMP)
    `);
  }
}

export async function getAllStatistics(query: QueryFn): Promise<TestStatistics[]> {
  return query<TestStatistics>(`
    SELECT id, test_id, total_attempts, total_correct, total_incorrect,
           total_skipped, last_attempt_at
    FROM test_statistics
  `);
}
