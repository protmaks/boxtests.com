import type { Test, TestWithQuestions, QuestionWithOptions } from '../../types/quiz';

type QueryFn = <T>(sql: string) => Promise<T[]>;

export async function getAllTests(query: QueryFn): Promise<Test[]> {
  return query<Test>(`
    SELECT test_id, display_name, group_id, subgroup_id, tags, 
           difficulty_level_id, description, created_at, updated_at
    FROM tests
    ORDER BY updated_at DESC
  `);
}

export async function getTestById(query: QueryFn, testId: number): Promise<Test | null> {
  const results = await query<Test>(`
    SELECT test_id, display_name, group_id, subgroup_id, tags,
           difficulty_level_id, description, created_at, updated_at
    FROM tests
    WHERE test_id = ${testId}
  `);
  return results[0] || null;
}

export async function getTestWithQuestions(
  query: QueryFn,
  testId: number
): Promise<TestWithQuestions | null> {
  const test = await getTestById(query, testId);
  if (!test) return null;

  // Query denormalized questions table (each row is one option)
  const rows = await query<{
    id: number;
    question_text: string;
    id_var: string;
    options: string;
    correct_answer: boolean;
    test_id: number;
    explanation: string | null;
  }>(`
    SELECT id, question_text, id_var, options, correct_answer, test_id, explanation
    FROM questions
    WHERE test_id = ${testId}
    ORDER BY id, id_var
  `);

  // Group by question id
  const questionsMap = new Map<number, QuestionWithOptions>();
  for (const row of rows) {
    if (!questionsMap.has(row.id)) {
      questionsMap.set(row.id, {
        id: row.id,
        question_text: row.question_text,
        test_id: row.test_id,
        explanation: row.explanation,
        options: [],
      });
    }
    const question = questionsMap.get(row.id)!;
    question.options.push({
      id: question.options.length + 1,
      question_id: row.id,
      test_id: row.test_id,
      option_letter: row.id_var,
      option_text: row.options,
      is_correct: row.correct_answer,
    });
  }

  return {
    ...test,
    questions: Array.from(questionsMap.values()),
  };
}

export async function deleteTest(run: (sql: string) => Promise<void>, testId: number): Promise<void> {
  await run(`DELETE FROM tests WHERE test_id = ${testId}`);
}

export async function getTestsGrouped(query: QueryFn): Promise<
  {
    group_id: number | null;
    group_name: string | null;
    group_color: string | null;
    tests: Test[];
  }[]
> {
  const tests = await query<Test & { group_name: string | null; group_color: string | null }>(`
    SELECT t.*, g.name as group_name, g.color as group_color
    FROM tests t
    LEFT JOIN test_groups g ON t.group_id = g.id
    ORDER BY g.name NULLS LAST, t.display_name
  `);

  const grouped = new Map<number | null, {
    group_id: number | null;
    group_name: string | null;
    group_color: string | null;
    tests: Test[];
  }>();

  for (const test of tests) {
    const key = test.group_id;
    if (!grouped.has(key)) {
      grouped.set(key, {
        group_id: test.group_id,
        group_name: test.group_name,
        group_color: test.group_color,
        tests: [],
      });
    }
    grouped.get(key)!.tests.push(test);
  }

  return Array.from(grouped.values());
}
