import type { TestGroup, TestSubgroup, DifficultyLevel } from '../../types/quiz';

type QueryFn = <T>(sql: string) => Promise<T[]>;

export async function getAllGroups(query: QueryFn): Promise<TestGroup[]> {
  return query<TestGroup>(`
    SELECT id, name, description, color
    FROM test_groups
    ORDER BY name
  `);
}

export async function getGroupById(query: QueryFn, groupId: number): Promise<TestGroup | null> {
  const results = await query<TestGroup>(`
    SELECT id, name, description, color
    FROM test_groups
    WHERE id = ${groupId}
  `);
  return results[0] || null;
}

export async function getSubgroupsByGroup(query: QueryFn, groupId: number): Promise<TestSubgroup[]> {
  return query<TestSubgroup>(`
    SELECT id, name, group_id, description, color
    FROM test_subgroups
    WHERE group_id = ${groupId}
    ORDER BY name
  `);
}

export async function getAllSubgroups(query: QueryFn): Promise<TestSubgroup[]> {
  return query<TestSubgroup>(`
    SELECT id, name, group_id, description, color
    FROM test_subgroups
    ORDER BY name
  `);
}

export async function getDifficultyLevelsByGroup(
  query: QueryFn,
  groupId: number
): Promise<DifficultyLevel[]> {
  return query<DifficultyLevel>(`
    SELECT id, name, color, description, group_id
    FROM difficulty_levels
    WHERE group_id = ${groupId}
    ORDER BY id
  `);
}

export async function getAllDifficultyLevels(query: QueryFn): Promise<DifficultyLevel[]> {
  return query<DifficultyLevel>(`
    SELECT id, name, color, description, group_id
    FROM difficulty_levels
    ORDER BY group_id, id
  `);
}
