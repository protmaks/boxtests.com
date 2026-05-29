type RunFn = (sql: string) => Promise<void>;
type QueryFn = <T>(sql: string) => Promise<T[]>;

function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

export async function createGroup(
  run: RunFn,
  query: QueryFn,
  data: {
    name: string;
    description?: string | null;
    color?: string;
  }
): Promise<number> {
  const maxId = await query<{ max_id: number | null }>(`SELECT MAX(id) as max_id FROM test_groups`);
  const newId = (maxId[0]?.max_id || 0) + 1;

  const description = data.description ? `'${escapeSQL(data.description)}'` : 'NULL';
  const color = data.color || '#667eea';

  await run(`
    INSERT INTO test_groups (id, name, description, color)
    VALUES (${newId}, '${escapeSQL(data.name)}', ${description}, '${color}')
  `);

  return newId;
}

export async function updateGroup(
  run: RunFn,
  groupId: number,
  data: {
    name?: string;
    description?: string | null;
    color?: string;
  }
): Promise<void> {
  const updates: string[] = [];

  if (data.name !== undefined) {
    updates.push(`name = '${escapeSQL(data.name)}'`);
  }
  if (data.description !== undefined) {
    updates.push(`description = ${data.description ? `'${escapeSQL(data.description)}'` : 'NULL'}`);
  }
  if (data.color !== undefined) {
    updates.push(`color = '${data.color}'`);
  }

  if (updates.length > 0) {
    await run(`UPDATE test_groups SET ${updates.join(', ')} WHERE id = ${groupId}`);
  }
}

export async function deleteGroup(run: RunFn, groupId: number): Promise<void> {
  await run(`DELETE FROM test_groups WHERE id = ${groupId}`);
}

export async function createSubgroup(
  run: RunFn,
  query: QueryFn,
  data: {
    name: string;
    group_id: number;
    description?: string | null;
    color?: string;
  }
): Promise<number> {
  const maxId = await query<{ max_id: number | null }>(`SELECT MAX(id) as max_id FROM test_subgroups`);
  const newId = (maxId[0]?.max_id || 0) + 1;

  const description = data.description ? `'${escapeSQL(data.description)}'` : 'NULL';
  const color = data.color || '#28a745';

  await run(`
    INSERT INTO test_subgroups (id, name, group_id, description, color)
    VALUES (${newId}, '${escapeSQL(data.name)}', ${data.group_id}, ${description}, '${color}')
  `);

  return newId;
}

export async function deleteSubgroup(run: RunFn, subgroupId: number): Promise<void> {
  await run(`DELETE FROM test_subgroups WHERE id = ${subgroupId}`);
}

export async function createDifficultyLevel(
  run: RunFn,
  query: QueryFn,
  data: {
    name: string;
    group_id: number;
    description?: string | null;
    color?: string;
  }
): Promise<number> {
  const maxId = await query<{ max_id: number | null }>(`SELECT MAX(id) as max_id FROM difficulty_levels`);
  const newId = (maxId[0]?.max_id || 0) + 1;

  const description = data.description ? `'${escapeSQL(data.description)}'` : 'NULL';
  const color = data.color || '#667eea';

  await run(`
    INSERT INTO difficulty_levels (id, name, group_id, description, color)
    VALUES (${newId}, '${escapeSQL(data.name)}', ${data.group_id}, ${description}, '${color}')
  `);

  return newId;
}

export async function deleteDifficultyLevel(run: RunFn, levelId: number): Promise<void> {
  await run(`DELETE FROM difficulty_levels WHERE id = ${levelId}`);
}
