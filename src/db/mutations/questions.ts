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
    question_group_id?: number | null;
    options: Array<{
      option_letter: string;
      option_text: string;
      is_correct: boolean;
    }>;
  }
): Promise<number> {
  // Get next question ID
  const maxId = await query<{ max_id: number | null }>(`SELECT MAX(id) as max_id FROM questions`);
  const questionId = (maxId[0]?.max_id || 0) + 1;

  const explanation = data.explanation ? `'${escapeSQL(data.explanation)}'` : 'NULL';
  const groupId = data.question_group_id ?? 'NULL';

  await run(`
    INSERT INTO questions (id, question_text, test_id, explanation, question_group_id)
    VALUES (${questionId}, '${escapeSQL(data.question_text)}', ${testId}, ${explanation}, ${groupId})
  `);

  // Insert options
  const maxOptionId = await query<{ max_id: number | null }>(`SELECT MAX(id) as max_id FROM question_options`);
  let optionId = (maxOptionId[0]?.max_id || 0) + 1;

  for (const option of data.options) {
    await run(`
      INSERT INTO question_options (id, question_id, test_id, option_letter, option_text, is_correct)
      VALUES (${optionId}, ${questionId}, ${testId}, '${escapeSQL(option.option_letter)}', '${escapeSQL(option.option_text)}', ${option.is_correct})
    `);
    optionId++;
  }

  return questionId;
}

export async function updateQuestion(
  run: RunFn,
  questionId: number,
  data: {
    question_text?: string;
    explanation?: string | null;
    question_group_id?: number | null;
  }
): Promise<void> {
  const updates: string[] = [];

  if (data.question_text !== undefined) {
    updates.push(`question_text = '${escapeSQL(data.question_text)}'`);
  }
  if (data.explanation !== undefined) {
    updates.push(`explanation = ${data.explanation ? `'${escapeSQL(data.explanation)}'` : 'NULL'}`);
  }
  if (data.question_group_id !== undefined) {
    updates.push(`question_group_id = ${data.question_group_id ?? 'NULL'}`);
  }

  if (updates.length > 0) {
    await run(`UPDATE questions SET ${updates.join(', ')} WHERE id = ${questionId}`);
  }
}

export async function deleteQuestion(run: RunFn, questionId: number): Promise<void> {
  await run(`DELETE FROM questions WHERE id = ${questionId}`);
}

export async function updateOption(
  run: RunFn,
  optionId: number,
  data: {
    option_text?: string;
    is_correct?: boolean;
  }
): Promise<void> {
  const updates: string[] = [];

  if (data.option_text !== undefined) {
    updates.push(`option_text = '${escapeSQL(data.option_text)}'`);
  }
  if (data.is_correct !== undefined) {
    updates.push(`is_correct = ${data.is_correct}`);
  }

  if (updates.length > 0) {
    await run(`UPDATE question_options SET ${updates.join(', ')} WHERE id = ${optionId}`);
  }
}

export async function deleteOption(run: RunFn, optionId: number): Promise<void> {
  await run(`DELETE FROM question_options WHERE id = ${optionId}`);
}
