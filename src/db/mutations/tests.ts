type RunFn = (sql: string) => Promise<void>;
type QueryFn = <T>(sql: string) => Promise<T[]>;

function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

export async function createTest(
  run: RunFn,
  query: QueryFn,
  data: {
    display_name: string;
    group_id?: number | null;
    subgroup_id?: number | null;
    difficulty_level_id?: number | null;
    description?: string | null;
    tags?: string | null;
  }
): Promise<number> {
  const maxId = await query<{ max_id: number | null }>(`SELECT MAX(test_id) as max_id FROM tests`);
  const newId = (maxId[0]?.max_id || 0) + 1;

  const groupId = data.group_id ?? 'NULL';
  const subgroupId = data.subgroup_id ?? 'NULL';
  const difficultyId = data.difficulty_level_id ?? 'NULL';
  const description = data.description ? `'${escapeSQL(data.description)}'` : 'NULL';
  const tags = data.tags ? `'${escapeSQL(data.tags)}'` : 'NULL';

  await run(`
    INSERT INTO tests (test_id, display_name, group_id, subgroup_id, difficulty_level_id, description, tags)
    VALUES (${newId}, '${escapeSQL(data.display_name)}', ${groupId}, ${subgroupId}, ${difficultyId}, ${description}, ${tags})
  `);

  return newId;
}

export async function updateTest(
  run: RunFn,
  testId: number,
  data: {
    display_name?: string;
    group_id?: number | null;
    subgroup_id?: number | null;
    difficulty_level_id?: number | null;
    description?: string | null;
    tags?: string | null;
  }
): Promise<void> {
  const updates: string[] = [];

  if (data.display_name !== undefined) {
    updates.push(`display_name = '${escapeSQL(data.display_name)}'`);
  }
  if (data.group_id !== undefined) {
    updates.push(`group_id = ${data.group_id ?? 'NULL'}`);
  }
  if (data.subgroup_id !== undefined) {
    updates.push(`subgroup_id = ${data.subgroup_id ?? 'NULL'}`);
  }
  if (data.difficulty_level_id !== undefined) {
    updates.push(`difficulty_level_id = ${data.difficulty_level_id ?? 'NULL'}`);
  }
  if (data.description !== undefined) {
    updates.push(`description = ${data.description ? `'${escapeSQL(data.description)}'` : 'NULL'}`);
  }
  if (data.tags !== undefined) {
    updates.push(`tags = ${data.tags ? `'${escapeSQL(data.tags)}'` : 'NULL'}`);
  }

  if (updates.length > 0) {
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    await run(`UPDATE tests SET ${updates.join(', ')} WHERE test_id = ${testId}`);
  }
}

export async function deleteTest(run: RunFn, testId: number): Promise<void> {
  await run(`DELETE FROM tests WHERE test_id = ${testId}`);
}
