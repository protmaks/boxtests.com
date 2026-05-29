# PM Tester Rewrite Roadmap: Flask to React + DuckDB WASM

## 1. Executive Summary

**PM Tester** is a self-testing web application built on Python/Flask with DuckDB as the database. The application allows users to:
- Create and manage quizzes with multiple question types (single/multi-answer)
- Organize tests into groups, subgroups, and difficulty levels
- Take tests in three modes: single-page, multi-page, and instant feedback
- Get AI-powered explanations via Google Gemini
- Track statistics and progress

**Rewrite Goal**: Migrate to a fully client-side architecture using React + DuckDB WASM, eliminating the backend server entirely. The new architecture will store data in the browser (OPFS) and synchronize with Google Drive for persistence, similar to draw.io's model.

**Key Benefits**:
- Zero backend infrastructure costs
- Offline-first functionality
- Data portability (users own their .duckdb files)
- Simplified deployment via GitHub Pages static hosting

---

## 2. Current Architecture Analysis

### 2.1 Project Structure

```
pm_tester/
├── app.py                 # Main Flask application (~2500 lines)
├── run.py                 # Development server entry point
├── wsgi.py                # WSGI entry point for production
├── requirements.txt       # Python dependencies
├── tests.duckdb           # DuckDB database file
├── templates/             # Jinja2 templates
│   ├── base.html          # Base layout with navigation
│   ├── index.html         # Home page
│   ├── tests.html         # Test listing (grouped view)
│   ├── test.html          # Single-page test mode
│   ├── test_multi.html    # Multi-page test mode
│   ├── test_instant.html  # Instant feedback mode
│   ├── test_results.html  # Results display
│   ├── test_mode_selection.html
│   ├── create_test.html   # Test creation form
│   ├── edit_test.html     # Test editing form
│   ├── setup_test_metadata.html
│   ├── upload.html        # File upload page
│   ├── manage_groups.html
│   └── manage_difficulty_levels.html
├── static/
│   ├── style.css          # Main styles (~800 lines)
│   └── script.js          # Client-side JS
├── build_exe.py           # PyInstaller build script (for desktop .exe)
├── _md/                   # Documentation files
└── images/                # Uploaded images (per test_id)
```

### 2.2 Flask Routes Summary

| Route | Method | Purpose |
|-------|--------|---------|
| `/` | GET | Home page |
| `/upload` | GET, POST | Upload files (PDF, TXT, images) for OCR parsing |
| `/tests` | GET | List all tests grouped by group/subgroup/difficulty |
| `/test/<id>/mode` | GET, POST | Select test mode (single/multi/instant) |
| `/test/<id>` | GET, POST | Single-page test taking & submission |
| `/test/<id>/question/<idx>` | GET, POST | Multi-page test navigation |
| `/test/<id>/instant/<idx>` | GET, POST | Instant feedback mode |
| `/test/<id>/instant/<idx>/save` | POST | Save instant answer (JSON) |
| `/test/<id>/instant/reset` | POST | Reset test progress |
| `/test/<id>/instant/reset-mistakes` | POST | Reset only incorrect/dont-know answers |
| `/test/<id>/results` | GET | Display test results |
| `/test/<id>/edit` | GET | Edit test page |
| `/test/<id>/delete` | POST | Delete test |
| `/create_test` | GET, POST | Create new test manually |
| `/edit_test/<id>` | GET, POST | Edit existing test |
| `/setup_test_metadata/<id>` | GET | Setup metadata after upload |
| `/save_test_metadata/<id>` | POST | Save test metadata |
| `/manage_groups` | GET, POST | CRUD for test groups |
| `/manage_difficulty_levels` | GET, POST | CRUD for difficulty levels |
| `/explain_question` | POST | AI explanation via Gemini |
| `/update_explanation` | POST | Save explanation to DB |
| `/upload_image/<id>` | POST | Upload image for WYSIWYG editor |
| `/images/<id>/<filename>` | GET | Serve uploaded images |
| `/api/test/<id>/questions` | GET | Get questions JSON |
| `/api/test/<id>/submit` | POST | Submit test answers |
| `/api/subgroups/<group_id>` | GET | Get subgroups for group |
| `/api/difficulty_levels/<group_id>` | GET | Get difficulty levels for group |
| `/api/create_*` | POST | API endpoints for creating entities |
| `/get_instant_stats/<id>` | GET | Get instant mode statistics |

### 2.3 Database Schema (DuckDB)

#### Table: `tests`
```sql
CREATE TABLE tests (
    test_id INTEGER PRIMARY KEY,
    display_name TEXT,
    group_id INTEGER,
    subgroup_id INTEGER,
    tags TEXT,
    difficulty_level_id INTEGER,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Table: `questions`
```sql
CREATE TABLE questions (
    id INTEGER PRIMARY KEY,      -- Question ID within test
    question_text TEXT,
    id_var TEXT,                  -- Option letter (a, b, c, d...)
    options TEXT,                 -- Option text (HTML allowed)
    correct_answer BOOLEAN,       -- Is this option correct
    test_id INTEGER,
    explanation TEXT,             -- HTML explanation
    question_group_id INTEGER     -- For grouping related questions
);
```

**Note**: Questions are stored in a denormalized format where each option is a separate row with the same `id` (question ID) but different `id_var` (option letter). This allows multiple correct answers per question.

#### Table: `test_groups`
```sql
CREATE TABLE test_groups (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#667eea'
);
```

#### Table: `test_subgroups`
```sql
CREATE TABLE test_subgroups (
    id INTEGER PRIMARY KEY,
    name TEXT,
    group_id INTEGER,
    description TEXT,
    color TEXT DEFAULT '#28a745'
);
```

#### Table: `difficulty_levels`
```sql
CREATE TABLE difficulty_levels (
    id INTEGER PRIMARY KEY,
    name TEXT,
    color TEXT DEFAULT '#667eea',
    description TEXT,
    group_id INTEGER
);
```

#### Table: `test_statistics`
```sql
CREATE TABLE test_statistics (
    id INTEGER PRIMARY KEY,
    test_id INTEGER,
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
```

#### Table: `test_current_session`
```sql
CREATE TABLE test_current_session (
    test_id INTEGER,
    question_index INTEGER,
    answer_json VARCHAR,
    is_answered BOOLEAN,
    updated_at TIMESTAMP,
    PRIMARY KEY (test_id, question_index)
);
```

### 2.4 Business Logic

#### Question Parsing (`parse_questions_from_text`)
- Parses text files with format:
  - Question text (multi-line)
  - `+ ` prefix for correct options
  - `- ` prefix for incorrect options
  - `EX:` prefix for explanation
- Supports multi-line options

#### Answer Evaluation
- **Single choice**: Compare user answer with correct option letter
- **Multiple choice**: Compare sets of selected options with correct options
- **Don't know**: Special `"0"` value, excluded from score calculation

#### Score Calculation
```
score_percentage = (correct_count / answered_questions) * 100
answered_questions = total_questions - dont_know_count
```

#### AI Explanation Generation
- Uses Google Gemini API (`gemini-2.5-flash`)
- Verifies answers against official documentation
- Returns JSON with status (CONFIRMED/NOT_CONFIRMED), evidence, and explanation

### 2.5 Session Management

Current implementation uses:
1. **Flask session** for multi-page test mode (stores answers temporarily)
2. **DuckDB `test_current_session` table** for instant mode (persistent across browser sessions)
3. **localStorage** on client for instant mode UI state sync

### 2.6 Frontend Stack

- **Templates**: Jinja2 with HTML/CSS
- **Rich Text Editor**: Quill.js for question/explanation editing
- **CSS**: Custom CSS (~800 lines), gradient-based modern design
- **JavaScript**: Vanilla JS for:
  - Instant mode answer checking
  - Progress tracking
  - Drag-and-drop file upload
  - Dynamic form handling

### 2.7 Dependencies (requirements.txt)

```
Flask==2.3.3
Werkzeug==2.3.7
duckdb==1.3.2
Jinja2==3.1.2
MarkupSafe==2.1.3
itsdangerous==2.1.2
click==8.1.7
blinker==1.6.3
pdf2image==1.17.0
pytesseract==0.3.10
numpy==2.1.1
Pillow==11.0.0
google-genai==1.33.0
python-dotenv==1.0.1
```

### 2.8 Issues & Technical Debt

1. **No TODO/FIXME comments** found in codebase
2. **Duplicate code** in `create_test_manual` and `edit_test_route`
3. **Debug print statements** left in production code
4. **OCR code** is mostly commented out (pdf2image/pytesseract)
5. **Denormalized questions schema** makes queries complex
6. **No input validation** on many form fields
7. **Mixed Russian/English** in UI and code

---

## 3. Architecture Mapping

### 3.1 Component Mapping Table

| Current (Flask) | New (React + DuckDB WASM) |
|-----------------|---------------------------|
| Flask app | React SPA (Vite) |
| Flask routes | React Router v6 |
| Jinja2 templates | React JSX components |
| Flask session | React Context / Zustand store |
| Server-side DuckDB | @duckdb/duckdb-wasm in Web Worker |
| File upload → server | FileReader API → DuckDB WASM |
| `tests.duckdb` on disk | OPFS + Google Drive sync |
| OCR (Tesseract) | **Removed** (out of scope for client-side) |
| Google Gemini server call | Direct Gemini API call from browser |
| Static CSS | Tailwind CSS or CSS Modules |
| Quill.js | TipTap or continue with Quill.js |
| form POST → redirect | React state + useMutation |

### 3.2 Route to Component Mapping

| Flask Route | React Route | Component |
|-------------|-------------|-----------|
| `/` | `/` | `HomePage` |
| `/tests` | `/tests` | `TestListPage` |
| `/test/<id>/mode` | `/test/:id/mode` | `TestModeSelector` |
| `/test/<id>` | `/test/:id/single` | `TestSinglePage` |
| `/test/<id>/question/<idx>` | `/test/:id/multi/:idx` | `TestMultiPage` |
| `/test/<id>/instant/<idx>` | `/test/:id/instant/:idx` | `TestInstantPage` |
| `/test/<id>/results` | `/test/:id/results` | `TestResultsPage` |
| `/create_test` | `/test/create` | `TestCreatePage` |
| `/edit_test/<id>` | `/test/:id/edit` | `TestEditPage` |
| `/manage_groups` | `/admin/groups` | `ManageGroupsPage` |
| `/manage_difficulty_levels` | `/admin/difficulty` | `ManageDifficultyPage` |

### 3.3 What Cannot Transfer Directly

1. **OCR functionality** (Tesseract) - requires server-side processing
   - **Solution**: Remove OCR, require formatted TXT import only
   
2. **Server-side file storage** - no server to store images
   - **Solution**: Store images as Base64 in DuckDB or use Google Drive
   
3. **Flask session** - no server-side sessions
   - **Solution**: React Context + localStorage/OPFS
   
4. **GOOGLE_API_KEY env variable** - no server to hide secrets
   - **Solution**: OAuth2 user token for Gemini API calls

### 3.4 What Simplifies

1. **No server deployment** - just static files on GitHub Pages
2. **No WSGI/Gunicorn** - client-side only
3. **No database server** - DuckDB WASM is embedded
4. **No session middleware** - React state management
5. **No auth middleware** - Google OAuth PKCE handles everything
6. **No rate limiting** - API quota managed by user's Google account

### 3.5 What Gets More Complex

1. **Google OAuth PKCE** - more complex than simple API key
2. **DuckDB WASM initialization** - async loading, Web Worker setup
3. **File sync with Google Drive** - conflict resolution, network errors
4. **OPFS management** - browser storage quotas, cleanup
5. **Cross-browser compatibility** - OPFS not supported everywhere
6. **Offline detection** - handling network state changes

---

## 4. DuckDB WASM Schema

### 4.1 Optimized Schema for Client-Side

```sql
-- =====================
-- CORE TABLES
-- =====================

CREATE TABLE tests (
    test_id INTEGER PRIMARY KEY,
    display_name TEXT NOT NULL,
    description TEXT,
    group_id INTEGER,
    subgroup_id INTEGER,
    difficulty_level_id INTEGER,
    tags TEXT,
    question_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Normalized questions table (different from current)
CREATE TABLE questions (
    question_id INTEGER PRIMARY KEY,
    test_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    explanation TEXT,
    question_order INTEGER NOT NULL,
    UNIQUE(test_id, question_order)
);

-- Separate options table (normalized)
CREATE TABLE question_options (
    option_id INTEGER PRIMARY KEY,
    question_id INTEGER NOT NULL,
    option_letter TEXT NOT NULL,  -- 'a', 'b', 'c', 'd', etc.
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    option_order INTEGER NOT NULL,
    UNIQUE(question_id, option_letter)
);

-- =====================
-- ORGANIZATION TABLES
-- =====================

CREATE TABLE test_groups (
    group_id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#667eea',
    display_order INTEGER DEFAULT 0
);

CREATE TABLE test_subgroups (
    subgroup_id INTEGER PRIMARY KEY,
    group_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#28a745',
    display_order INTEGER DEFAULT 0,
    UNIQUE(group_id, name)
);

CREATE TABLE difficulty_levels (
    level_id INTEGER PRIMARY KEY,
    group_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#667eea',
    display_order INTEGER DEFAULT 0,
    UNIQUE(group_id, name)
);

-- =====================
-- PROGRESS & STATS TABLES
-- =====================

CREATE TABLE test_statistics (
    stat_id INTEGER PRIMARY KEY,
    test_id INTEGER UNIQUE NOT NULL,
    total_attempts INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    total_answered INTEGER DEFAULT 0,
    total_dont_know INTEGER DEFAULT 0,
    best_score_percent REAL DEFAULT 0,
    last_attempt_at TIMESTAMP
);

CREATE TABLE session_answers (
    test_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    answer_value TEXT,  -- JSON array of selected option letters
    is_correct BOOLEAN,
    is_dont_know BOOLEAN DEFAULT FALSE,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (test_id, question_id)
);

-- =====================
-- MEDIA STORAGE (optional)
-- =====================

CREATE TABLE media_blobs (
    media_id INTEGER PRIMARY KEY,
    test_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    blob_data BLOB NOT NULL,  -- Base64 or binary
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- INDEXES
-- =====================

CREATE INDEX idx_questions_test ON questions(test_id);
CREATE INDEX idx_options_question ON question_options(question_id);
CREATE INDEX idx_tests_group ON tests(group_id);
CREATE INDEX idx_subgroups_group ON test_subgroups(group_id);
CREATE INDEX idx_difficulty_group ON difficulty_levels(group_id);
CREATE INDEX idx_stats_test ON test_statistics(test_id);
CREATE INDEX idx_answers_test ON session_answers(test_id);
```

### 4.2 Migration Script (Python)

```python
#!/usr/bin/env python3
"""
Migration script: Convert existing tests.duckdb to new schema
Run: python migrate_to_new_schema.py tests.duckdb output.duckdb
"""

import duckdb
import sys
import json

def migrate(input_path: str, output_path: str):
    old_conn = duckdb.connect(input_path, read_only=True)
    new_conn = duckdb.connect(output_path)
    
    # Create new schema (paste DDL from above)
    new_conn.execute("""...""")
    
    # Migrate test_groups
    groups = old_conn.execute("SELECT * FROM test_groups").fetchall()
    for g in groups:
        new_conn.execute(
            "INSERT INTO test_groups VALUES (?, ?, ?, ?)",
            [g[0], g[1], g[2], g[3]]
        )
    
    # Migrate questions (denormalized → normalized)
    tests = old_conn.execute("SELECT DISTINCT test_id FROM questions").fetchall()
    for (test_id,) in tests:
        rows = old_conn.execute("""
            SELECT id, question_text, id_var, options, correct_answer, explanation
            FROM questions WHERE test_id = ? ORDER BY id, id_var
        """, [test_id]).fetchall()
        
        # Group by question id
        questions = {}
        for row in rows:
            qid = row[0]
            if qid not in questions:
                questions[qid] = {
                    'text': row[1],
                    'explanation': row[5],
                    'options': []
                }
            questions[qid]['options'].append({
                'letter': row[2],
                'text': row[3],
                'is_correct': bool(row[4])
            })
        
        # Insert normalized
        for order, (qid, q) in enumerate(questions.items()):
            new_conn.execute("""
                INSERT INTO questions (question_id, test_id, question_text, explanation, question_order)
                VALUES (?, ?, ?, ?, ?)
            """, [qid, test_id, q['text'], q['explanation'], order])
            
            for opt_order, opt in enumerate(q['options']):
                new_conn.execute("""
                    INSERT INTO question_options (question_id, option_letter, option_text, is_correct, option_order)
                    VALUES (?, ?, ?, ?, ?)
                """, [qid, opt['letter'], opt['text'], opt['is_correct'], opt_order])
    
    new_conn.close()
    old_conn.close()
    print(f"Migration complete: {output_path}")

if __name__ == "__main__":
    migrate(sys.argv[1], sys.argv[2])
```

---

## 5. Detailed Roadmap

### Milestone 0: Project Scaffolding (1 day)

**Goal**: Create deployable React project skeleton on GitHub Pages

#### Tasks:

| # | Task | Files | Complexity |
|---|------|-------|------------|
| 0.1 | Initialize Vite + React + TypeScript project | `package.json`, `vite.config.ts`, `tsconfig.json` | Low |
| 0.2 | Configure GitHub Actions for deployment | `.github/workflows/deploy.yml` | Low |
| 0.3 | Set up base path for GitHub Pages | `vite.config.ts` (base: '/pm_tester/') | Low |
| 0.4 | Add basic routing structure | `src/App.tsx`, `src/router.tsx` | Low |
| 0.5 | Add placeholder pages | `src/pages/*.tsx` | Low |

#### Completion Criteria:
- [ ] `npm run build` produces working static build
- [ ] GitHub Actions deploys to `https://<user>.github.io/pm_tester/`
- [ ] All placeholder routes render correctly

#### Dependencies: None

---

### Milestone 1: DuckDB WASM Core (2-3 days)

**Goal**: DuckDB WASM running in Web Worker with file import/export

#### Tasks:

| # | Task | Files | Complexity |
|---|------|-------|------------|
| 1.1 | Install @duckdb/duckdb-wasm | `package.json` | Low |
| 1.2 | Create DuckDB Web Worker wrapper | `src/workers/duckdb.worker.ts` | Medium |
| 1.3 | Create DuckDB Context Provider | `src/context/DuckDBContext.tsx` | Medium |
| 1.4 | Implement schema initialization | `src/db/schema.ts` | Low |
| 1.5 | Implement file import (ArrayBuffer → DB) | `src/db/import.ts` | Medium |
| 1.6 | Implement file export (DB → ArrayBuffer) | `src/db/export.ts` | Medium |
| 1.7 | Add OPFS persistence layer | `src/db/opfs.ts` | High |
| 1.8 | Create useDB hook for queries | `src/hooks/useDB.ts` | Medium |

#### Key Code Structure:

```typescript
// src/context/DuckDBContext.tsx
interface DuckDBContextValue {
  db: AsyncDuckDB | null;
  isLoading: boolean;
  error: Error | null;
  importFromFile: (file: File) => Promise<void>;
  exportToFile: () => Promise<Blob>;
  query: <T>(sql: string, params?: any[]) => Promise<T[]>;
}
```

#### Completion Criteria:
- [ ] DuckDB initializes in Web Worker without blocking UI
- [ ] Can load `.duckdb` file via file input
- [ ] Can execute SELECT queries and display results
- [ ] Can export database back to `.duckdb` file
- [ ] Data persists across page refreshes via OPFS

#### Dependencies: Milestone 0

---

### Milestone 2: Google Drive Integration (2-3 days)

**Goal**: Open/save `.duckdb` files to/from Google Drive

#### Tasks:

| # | Task | Files | Complexity |
|---|------|-------|------------|
| 2.1 | Set up Google Cloud project, enable APIs | (Console) | Low |
| 2.2 | Implement OAuth2 PKCE flow | `src/auth/GoogleAuth.tsx` | High |
| 2.3 | Create Auth Context Provider | `src/context/AuthContext.tsx` | Medium |
| 2.4 | Implement Google Picker component | `src/components/GoogleFilePicker.tsx` | High |
| 2.5 | Implement Drive API download | `src/drive/download.ts` | Medium |
| 2.6 | Implement Drive API upload | `src/drive/upload.ts` | Medium |
| 2.7 | Add beforeunload save dialog | `src/hooks/useBeforeUnload.ts` | Medium |
| 2.8 | Add save-to-Drive button | `src/components/SaveToDrive.tsx` | Low |

#### OAuth2 PKCE Flow:

```typescript
// src/auth/GoogleAuth.tsx
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',  // Own files only
  'https://www.googleapis.com/auth/drive.readonly'  // For Picker
];

// PKCE: generate code_verifier, code_challenge
// Redirect to Google OAuth
// Exchange code for access_token (no refresh token in SPA)
```

#### Completion Criteria:
- [ ] User can sign in with Google
- [ ] Google Picker opens and allows selecting `.duckdb` files
- [ ] Selected file downloads and loads into DuckDB WASM
- [ ] Changes can be saved back to the same file on Drive
- [ ] beforeunload prompts to save if there are unsaved changes

#### Dependencies: Milestone 1

---

### Milestone 3: Quiz Engine (3-4 days)

**Goal**: Core quiz-taking functionality matching Flask app

#### Tasks:

| # | Task | Files | Complexity |
|---|------|-------|------------|
| 3.1 | Create TestList page with grouping | `src/pages/TestListPage.tsx` | Medium |
| 3.2 | Create TestModeSelector page | `src/pages/TestModeSelector.tsx` | Low |
| 3.3 | Create TestSinglePage (all questions) | `src/pages/TestSinglePage.tsx` | Medium |
| 3.4 | Create TestInstantPage (one at a time) | `src/pages/TestInstantPage.tsx` | High |
| 3.5 | Create TestResultsPage | `src/pages/TestResultsPage.tsx` | Medium |
| 3.6 | Implement answer evaluation logic | `src/quiz/evaluate.ts` | Medium |
| 3.7 | Implement statistics tracking | `src/quiz/statistics.ts` | Medium |
| 3.8 | Create QuestionCard component | `src/components/QuestionCard.tsx` | Medium |
| 3.9 | Create OptionList component | `src/components/OptionList.tsx` | Medium |
| 3.10 | Create ProgressBar component | `src/components/ProgressBar.tsx` | Low |

#### SQL Queries:

```sql
-- Get test with questions
SELECT 
  t.test_id, t.display_name,
  q.question_id, q.question_text, q.explanation, q.question_order,
  o.option_letter, o.option_text, o.is_correct
FROM tests t
JOIN questions q ON q.test_id = t.test_id
JOIN question_options o ON o.question_id = q.question_id
WHERE t.test_id = ?
ORDER BY q.question_order, o.option_order;

-- Save instant answer
INSERT OR REPLACE INTO session_answers 
  (test_id, question_id, answer_value, is_correct, is_dont_know, answered_at)
VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP);

-- Get instant stats
SELECT 
  COUNT(*) FILTER (WHERE is_correct = TRUE) as correct,
  COUNT(*) FILTER (WHERE is_correct = FALSE AND is_dont_know = FALSE) as incorrect,
  COUNT(*) FILTER (WHERE is_dont_know = TRUE) as dont_know,
  (SELECT COUNT(*) FROM questions WHERE test_id = ?) - COUNT(*) as unanswered
FROM session_answers
WHERE test_id = ?;
```

#### Completion Criteria:
- [ ] Test list displays grouped by group/subgroup/difficulty
- [ ] Can select test mode (single/instant)
- [ ] Single page mode shows all questions, submits, shows results
- [ ] Instant mode shows one question, checks immediately, tracks progress
- [ ] "Don't know" option works and is excluded from score
- [ ] Statistics are saved and displayed

#### Dependencies: Milestone 1

---

### Milestone 4: Test Management UI (2-3 days)

**Goal**: CRUD for tests, groups, questions

#### Tasks:

| # | Task | Files | Complexity |
|---|------|-------|------------|
| 4.1 | Create TestCreatePage | `src/pages/TestCreatePage.tsx` | High |
| 4.2 | Create TestEditPage | `src/pages/TestEditPage.tsx` | High |
| 4.3 | Create QuestionEditor component | `src/components/QuestionEditor.tsx` | High |
| 4.4 | Integrate rich text editor (TipTap/Quill) | `src/components/RichTextEditor.tsx` | Medium |
| 4.5 | Create ManageGroupsPage | `src/pages/ManageGroupsPage.tsx` | Medium |
| 4.6 | Create ManageDifficultyPage | `src/pages/ManageDifficultyPage.tsx` | Medium |
| 4.7 | Implement TXT file import parser | `src/import/parseQuestions.ts` | Medium |
| 4.8 | Create ImportTestPage | `src/pages/ImportTestPage.tsx` | Medium |

#### Completion Criteria:
- [ ] Can create new test with questions manually
- [ ] Can edit existing test questions
- [ ] Can manage groups and subgroups
- [ ] Can manage difficulty levels
- [ ] Can import TXT file with questions
- [ ] Rich text editor works for question/explanation text

#### Dependencies: Milestone 3

---

### Milestone 5: AI Explanations (1-2 days)

**Goal**: Google Gemini integration for explanations

#### Tasks:

| # | Task | Files | Complexity |
|---|------|-------|------------|
| 5.1 | Create Gemini API client | `src/ai/gemini.ts` | Medium |
| 5.2 | Add explain button to QuestionCard | `src/components/QuestionCard.tsx` | Low |
| 5.3 | Create ExplanationEditor component | `src/components/ExplanationEditor.tsx` | Medium |
| 5.4 | Handle API errors gracefully | `src/ai/gemini.ts` | Low |

#### Note on API Key:
Since there's no backend, the Gemini API key must be provided by the user in settings or use their own OAuth token. Consider:
1. User enters their own Gemini API key in settings (stored in localStorage)
2. Or: Use Google OAuth to call Gemini API (if Gemini supports OAuth)

#### Completion Criteria:
- [ ] "Explain with AI" button generates explanation
- [ ] Explanation can be edited and saved
- [ ] API errors show user-friendly messages

#### Dependencies: Milestone 3

---

### Milestone 6: Data Migration (1 day)

**Goal**: Scripts and documentation for migrating from Flask version

#### Tasks:

| # | Task | Files | Complexity |
|---|------|-------|------------|
| 6.1 | Create Python migration script | `scripts/migrate.py` | Medium |
| 6.2 | Create migration documentation | `docs/MIGRATION.md` | Low |
| 6.3 | Test migration with real data | - | Low |

#### Completion Criteria:
- [ ] Migration script converts old schema to new
- [ ] Documentation explains migration steps
- [ ] Migrated data works in new app

#### Dependencies: Milestone 4

---

### Milestone 7: Testing & Polish (2-3 days)

**Goal**: Tests, mobile support, edge cases

#### Tasks:

| # | Task | Files | Complexity |
|---|------|-------|------------|
| 7.1 | Set up Vitest | `vitest.config.ts` | Low |
| 7.2 | Unit tests for quiz evaluation | `src/quiz/__tests__/` | Medium |
| 7.3 | Unit tests for SQL queries | `src/db/__tests__/` | Medium |
| 7.4 | E2E test with Playwright | `e2e/quiz.spec.ts` | High |
| 7.5 | Mobile responsive CSS fixes | `src/styles/` | Medium |
| 7.6 | OPFS fallback for unsupported browsers | `src/db/opfs.ts` | Medium |
| 7.7 | Offline indicator | `src/components/OfflineIndicator.tsx` | Low |
| 7.8 | Error boundaries | `src/components/ErrorBoundary.tsx` | Low |

#### Completion Criteria:
- [ ] Unit tests pass (>80% coverage on core logic)
- [ ] E2E test passes: load file → take test → save file
- [ ] Works on mobile browsers (iOS Safari, Android Chrome)
- [ ] Graceful degradation when OPFS unavailable
- [ ] Offline state is clearly indicated

#### Dependencies: Milestones 3, 4

---

## 6. Risks & Open Questions

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| OPFS browser support | High | Fallback to IndexedDB or manual save |
| DuckDB WASM file size (~10MB) | Medium | Lazy loading, CDN caching |
| Google OAuth token expiry | Medium | Prompt re-auth, save before expiry |
| Large databases (>50MB) | Medium | Warn users, recommend splitting |
| Safari Web Worker issues | Medium | Test early, polyfills if needed |

### Open Questions

1. **OCR support**: Should we add client-side OCR (Tesseract.js) or remove entirely?
   - **Recommendation**: Remove for v1, add later if needed

2. **Multi-page test mode**: Is it still needed alongside instant mode?
   - **Recommendation**: Keep only single-page and instant modes

3. **Image storage**: Base64 in DB vs Google Drive vs remove?
   - **Recommendation**: Base64 for small images, prompt to use URLs for large

4. **Gemini API access**: User provides key vs OAuth?
   - **Recommendation**: User provides their own key in settings

5. **Offline editing**: How to handle offline changes?
   - **Recommendation**: Queue changes, sync on reconnect

---

## 7. Quick Start

```bash
# Clone and setup
git clone https://github.com/protmaks/pm_tester.git
cd pm_tester

# Create new React project (in a new directory)
npm create vite@latest pm-tester-web -- --template react-ts
cd pm-tester-web

# Install dependencies
npm install @duckdb/duckdb-wasm react-router-dom zustand
npm install -D tailwindcss postcss autoprefixer @types/node

# Initialize Tailwind
npx tailwindcss init -p

# Configure vite.config.ts for GitHub Pages
# Add: base: '/pm_tester/'

# Start development
npm run dev

# Deploy
git push origin main  # GitHub Actions handles deployment
```

### Recommended Directory Structure

```
pm-tester-web/
├── public/
│   └── duckdb/          # WASM files
├── src/
│   ├── components/      # Reusable UI components
│   ├── context/         # React contexts (DuckDB, Auth)
│   ├── db/              # Database operations
│   ├── drive/           # Google Drive API
│   ├── auth/            # OAuth2 PKCE
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components
│   ├── quiz/            # Quiz business logic
│   ├── workers/         # Web Workers
│   ├── styles/          # CSS/Tailwind
│   ├── types/           # TypeScript types
│   ├── utils/           # Utilities
│   ├── App.tsx
│   ├── main.tsx
│   └── router.tsx
├── scripts/
│   └── migrate.py       # Migration script
├── e2e/
│   └── quiz.spec.ts     # E2E tests
├── .github/
│   └── workflows/
│       └── deploy.yml   # GitHub Actions
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

---

## Appendix A: Estimated Timeline

| Milestone | Duration | Dependencies |
|-----------|----------|--------------|
| M0: Scaffolding | 1 day | - |
| M1: DuckDB WASM | 2-3 days | M0 |
| M2: Google Drive | 2-3 days | M1 |
| M3: Quiz Engine | 3-4 days | M1 |
| M4: Test Management | 2-3 days | M3 |
| M5: AI Explanations | 1-2 days | M3 |
| M6: Migration | 1 day | M4 |
| M7: Testing | 2-3 days | M3, M4 |

**Total: 14-20 days** (assuming sequential work)

With parallel work (M2 + M3 can overlap), estimate **12-15 days**.

---

## Appendix B: Google Cloud Setup

1. Create project at https://console.cloud.google.com
2. Enable APIs:
   - Google Drive API
   - Google Picker API
3. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized JavaScript origins: `https://<user>.github.io`
   - Authorized redirect URIs: `https://<user>.github.io/pm_tester/auth/callback`
4. Get Client ID (no client secret for SPA)
5. Configure consent screen (for production, submit for verification)
