export const SCHEMA_SQL = `
-- Test groups
CREATE TABLE IF NOT EXISTS test_groups (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#667eea'
);

-- Test subgroups
CREATE TABLE IF NOT EXISTS test_subgroups (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  group_id INTEGER NOT NULL REFERENCES test_groups(id) ON DELETE CASCADE,
  description TEXT,
  color TEXT DEFAULT '#28a745'
);

-- Difficulty levels
CREATE TABLE IF NOT EXISTS difficulty_levels (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#667eea',
  description TEXT,
  group_id INTEGER NOT NULL REFERENCES test_groups(id) ON DELETE CASCADE
);

-- Tests
CREATE TABLE IF NOT EXISTS tests (
  test_id INTEGER PRIMARY KEY,
  display_name TEXT NOT NULL,
  group_id INTEGER REFERENCES test_groups(id) ON DELETE SET NULL,
  subgroup_id INTEGER REFERENCES test_subgroups(id) ON DELETE SET NULL,
  tags TEXT,
  difficulty_level_id INTEGER REFERENCES difficulty_levels(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY,
  question_text TEXT NOT NULL,
  test_id INTEGER NOT NULL REFERENCES tests(test_id) ON DELETE CASCADE,
  explanation TEXT,
  question_group_id INTEGER
);

-- Question options (normalized from original schema)
CREATE TABLE IF NOT EXISTS question_options (
  id INTEGER PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  test_id INTEGER NOT NULL REFERENCES tests(test_id) ON DELETE CASCADE,
  option_letter TEXT NOT NULL,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE
);

-- Test statistics
CREATE TABLE IF NOT EXISTS test_statistics (
  id INTEGER PRIMARY KEY,
  test_id INTEGER NOT NULL UNIQUE REFERENCES tests(test_id) ON DELETE CASCADE,
  total_attempts INTEGER DEFAULT 0,
  total_correct INTEGER DEFAULT 0,
  total_incorrect INTEGER DEFAULT 0,
  total_skipped INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP
);

-- Session answers (for tracking progress in instant mode)
CREATE TABLE IF NOT EXISTS session_answers (
  id INTEGER PRIMARY KEY,
  test_id INTEGER NOT NULL REFERENCES tests(test_id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_options TEXT,
  is_correct BOOLEAN,
  status TEXT DEFAULT 'answered',
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Media blobs (for storing images)
CREATE TABLE IF NOT EXISTS media_blobs (
  id INTEGER PRIMARY KEY,
  test_id INTEGER NOT NULL REFERENCES tests(test_id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  data BLOB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_questions_test_id ON questions(test_id);
CREATE INDEX IF NOT EXISTS idx_question_options_question_id ON question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_session_answers_test_id ON session_answers(test_id);
CREATE INDEX IF NOT EXISTS idx_tests_group_id ON tests(group_id);
CREATE INDEX IF NOT EXISTS idx_test_subgroups_group_id ON test_subgroups(group_id);
`;

export async function initializeSchema(db: { run: (sql: string) => Promise<void> }): Promise<void> {
  await db.run(SCHEMA_SQL);
}
