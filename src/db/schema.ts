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
  group_id INTEGER NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#28a745'
);

-- Difficulty levels
CREATE TABLE IF NOT EXISTS difficulty_levels (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#667eea',
  description TEXT,
  group_id INTEGER NOT NULL
);

-- Tests
CREATE TABLE IF NOT EXISTS tests (
  test_id INTEGER PRIMARY KEY,
  display_name TEXT NOT NULL,
  group_id INTEGER,
  subgroup_id INTEGER,
  tags TEXT,
  difficulty_level_id INTEGER,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions (denormalized: each row is one option for a question)
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER,
  question_text TEXT,
  id_var TEXT,
  options TEXT,
  correct_answer BOOLEAN DEFAULT FALSE,
  test_id INTEGER NOT NULL,
  explanation TEXT
);

-- Question options (normalized - legacy, may not exist in actual DB)
CREATE TABLE IF NOT EXISTS question_options (
  id INTEGER PRIMARY KEY,
  question_id INTEGER NOT NULL,
  test_id INTEGER NOT NULL,
  option_letter TEXT NOT NULL,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE
);

-- Test statistics
CREATE TABLE IF NOT EXISTS test_statistics (
  id INTEGER PRIMARY KEY,
  test_id INTEGER NOT NULL UNIQUE,
  total_attempts INTEGER DEFAULT 0,
  total_correct_answers INTEGER DEFAULT 0,
  total_questions_answered INTEGER DEFAULT 0,
  average_score FLOAT DEFAULT 0,
  best_score FLOAT DEFAULT 0,
  last_attempt_date TIMESTAMP,
  total_dont_know INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session answers (for tracking progress in instant mode)
CREATE TABLE IF NOT EXISTS test_current_session (
  test_id INTEGER NOT NULL,
  question_index INTEGER NOT NULL,
  answer_json VARCHAR,
  is_answered BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (test_id, question_index)
);

-- Media blobs (for storing images)
CREATE TABLE IF NOT EXISTS media_blobs (
  id INTEGER PRIMARY KEY,
  test_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  data BLOB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_questions_test_id ON questions(test_id);
CREATE INDEX IF NOT EXISTS idx_question_options_question_id ON question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_test_current_session_test_id ON test_current_session(test_id);
CREATE INDEX IF NOT EXISTS idx_tests_group_id ON tests(group_id);
CREATE INDEX IF NOT EXISTS idx_test_subgroups_group_id ON test_subgroups(group_id);
`;

export async function initializeSchema(db: { run: (sql: string) => Promise<void> }): Promise<void> {
  await db.run(SCHEMA_SQL);
}
