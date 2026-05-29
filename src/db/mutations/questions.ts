type RunFn = (sql: string) => Promise<void>;
type QueryFn = <T>(sql: string) => Promise<T[]>;

function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

export async function createQuestion(
  run: RunFn,
  query: QueryFn,
  testId: number,
  data: {
    question_text: string;
    explanation?: string | null;
    options: Array<{
      option_letter: string;
      option_text: string;
      is_correct: boolean;
    }>;
  }
): Promise<number> {
  // Get next question ID for this test
  const maxId = await query<{ max_id: number | null }>(
    `SELECT MAX(id) as max_id FROM questions WHERE test_id = ${testId}`
  );
  const questionId = (maxId[0]?.max_id || 0) + 1;

  const explanation = data.explanation ? `'${escapeSQL(data.explanation)}'` : 'NULL';

  // Insert each option as a separate row (denormalized format)
  for (const option of data.options) {
    await run(`
      INSERT INTO questions (id, question_text, id_var, options, correct_answer, test_id, explanation)
      VALUES (${questionId}, '${escapeSQL(data.question_text)}', '${escapeSQL(option.option_letter)}', '${escapeSQL(option.option_text)}', ${option.is_correct}, ${testId}, ${explanation})
    `);
  }

  return questionId;
}

export async function updateQuestion(
  run: RunFn,
  testId: number,
  questionId: number,
  data: {
    question_text?: string;
    explanation?: string | null;
  }
): Promise<void> {
  const updates: string[] = [];

  if (data.question_text !== undefined) {
    updates.push(`question_text = '${escapeSQL(data.question_text)}'`);
  }
  if (data.explanation !== undefined) {
    updates.push(`explanation = ${data.explanation ? `'${escapeSQL(data.explanation)}'` : 'NULL'}`);
  }

  if (updates.length > 0) {
    await run(`UPDATE questions SET ${updates.join(', ')} WHERE id = ${questionId} AND test_id = ${testId}`);
  }
}

export async function deleteQuestion(run: RunFn, testId: number, questionId: number): Promise<void> {
  await run(`DELETE FROM questions WHERE id = ${questionId} AND test_id = ${testId}`);
}

export async function updateOption(
  run: RunFn,
  testId: number,
  questionId: number,
  optionLetter: string,
  data: {
    option_text?: string;
    is_correct?: boolean;
  }
): Promise<void> {
  const updates: string[] = [];

  if (data.option_text !== undefined) {
    updates.push(`options = '${escapeSQL(data.option_text)}'`);
  }
  if (data.is_correct !== undefined) {
    updates.push(`correct_answer = ${data.is_correct}`);
  }

  if (updates.length > 0) {
    await run(`UPDATE questions SET ${updates.join(', ')} WHERE id = ${questionId} AND test_id = ${testId} AND id_var = '${escapeSQL(optionLetter)}'`);
  }
}

export async function deleteOption(run: RunFn, testId: number, questionId: number, optionLetter: string): Promise<void> {
  await run(`DELETE FROM questions WHERE id = ${questionId} AND test_id = ${testId} AND id_var = '${escapeSQL(optionLetter)}'`);
}
