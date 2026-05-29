# PM Tester Rewrite Checklist

> Step-by-step checklist based on [REWRITE_ROADMAP.md](REWRITE_ROADMAP.md)  
> Mark `[x]` when completing each step

---

## Milestone 0: Project Scaffolding (1 day)

**Goal**: Create a deployable React project skeleton on GitHub Pages

### 0.1 Project Initialization
- [x] Create project directory
  ```bash
  mkdir pm-tester-web && cd pm-tester-web
  ```
- [x] Initialize Vite + React + TypeScript
  ```bash
  npm create vite@latest . -- --template react-ts
  ```
- [x] Install base dependencies
  ```bash
  npm install
  ```

### 0.2 Tailwind CSS Setup
- [x] Install Tailwind
  ```bash
  npm install -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p
  ```
- [x] Configure `tailwind.config.js`
- [x] Add Tailwind directives to `src/index.css`

### 0.3 GitHub Pages Setup
- [x] Update `vite.config.ts` with `base: '/pm_tester/'`
- [x] Create `.github/workflows/deploy.yml`
  ```yaml
  name: Deploy to GitHub Pages
  on:
    push:
      branches: [main]
  jobs:
    deploy:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: 20
        - run: npm ci
        - run: npm run build
        - uses: peaceiris/actions-gh-pages@v3
          with:
            github_token: ${{ secrets.GITHUB_TOKEN }}
            publish_dir: ./dist
  ```

### 0.4 Directory Structure
- [x] Create folder structure:
  ```
  src/
  ├── components/
  ├── context/
  ├── db/
  ├── drive/
  ├── auth/
  ├── hooks/
  ├── pages/
  ├── quiz/
  ├── workers/
  ├── styles/
  ├── types/
  └── utils/
  ```

### 0.5 Basic Routing
- [x] Install React Router
  ```bash
  npm install react-router-dom
  ```
- [x] Create `src/router.tsx` with routes
- [x] Update `src/App.tsx` with RouterProvider
- [x] Create placeholder pages:
  - [x] `src/pages/HomePage.tsx`
  - [x] `src/pages/TestListPage.tsx`
  - [x] `src/pages/TestModeSelector.tsx`
  - [x] `src/pages/TestSinglePage.tsx`
  - [x] `src/pages/TestInstantPage.tsx`
  - [x] `src/pages/TestResultsPage.tsx`
  - [x] `src/pages/TestCreatePage.tsx`
  - [x] `src/pages/TestEditPage.tsx`
  - [x] `src/pages/ManageGroupsPage.tsx`
  - [x] `src/pages/ManageDifficultyPage.tsx`

### 0.6 First Deploy
- [x] Create Git repository
  ```bash
  git init
  git add .
  git commit -m "Initial commit: Vite + React + TypeScript"
  ```
- [x] Push to GitHub
- [x] Verify GitHub Actions deployment
- [x] Verify app works at `https://<user>.github.io/pm_tester/`

**✅ M0 Completion Criteria:**
- [x] `npm run build` creates working build
- [x] GitHub Actions deploys to GitHub Pages
- [x] All placeholder routes render

---

## Milestone 1: DuckDB WASM Core (2-3 days)

**Goal**: DuckDB WASM runs in Web Worker with file import/export

### 1.1 DuckDB WASM Installation
- [ ] Install package
  ```bash
  npm install @duckdb/duckdb-wasm
  ```
- [ ] Copy WASM files to `public/duckdb/`
  ```bash
  mkdir -p public/duckdb
  cp node_modules/@duckdb/duckdb-wasm/dist/*.wasm public/duckdb/
  cp node_modules/@duckdb/duckdb-wasm/dist/*.worker.js public/duckdb/
  ```

### 1.2 DuckDB Web Worker
- [ ] Create `src/workers/duckdb.worker.ts`
- [ ] Configure Vite for Web Workers (vite.config.ts)
- [ ] Implement message passing protocol:
  - [ ] `INIT` - DB initialization
  - [ ] `QUERY` - SQL execution
  - [ ] `IMPORT` - load .duckdb file
  - [ ] `EXPORT` - export .duckdb file

### 1.3 DuckDB Context Provider
- [x] Create `src/context/DuckDBContext.tsx`
- [x] Implement interface:
  ```typescript
  interface DuckDBContextValue {
    db: AsyncDuckDB | null;
    isLoading: boolean;
    error: Error | null;
    importFromFile: (file: File) => Promise<void>;
    exportToFile: () => Promise<Blob>;
    query: <T>(sql: string, params?: any[]) => Promise<T[]>;
  }
  ```
- [ ] Add Provider to App.tsx

### 1.4 Database Schema
- [x] Create `src/db/schema.ts` with DDL
- [x] Implement `initializeSchema()` function
- [x] Tables:
  - [x] `tests`
  - [x] `questions`
  - [x] `question_options`
  - [x] `test_groups`
  - [x] `test_subgroups`
  - [x] `difficulty_levels`
  - [x] `test_statistics`
  - [x] `session_answers`
  - [x] `media_blobs`
- [x] Indexes

### 1.5 File Import/Export
- [ ] Create `src/db/import.ts`
  - [ ] `importFromArrayBuffer(buffer: ArrayBuffer)`
  - [ ] `importFromFile(file: File)`
- [ ] Create `src/db/export.ts`
  - [ ] `exportToArrayBuffer(): ArrayBuffer`
  - [ ] `exportToBlob(): Blob`
  - [ ] `downloadAsFile(filename: string)`

### 1.6 OPFS Persistence
- [ ] Create `src/db/opfs.ts`
- [ ] Implement:
  - [ ] `saveToOPFS(db: ArrayBuffer)`
  - [ ] `loadFromOPFS(): ArrayBuffer | null`
  - [ ] `hasOPFSSupport(): boolean`
- [ ] Fallback to IndexedDB if OPFS unavailable

### 1.7 useDB Hook
- [x] Create `src/hooks/useDB.ts`
- [x] Implement:
  ```typescript
  function useDB() {
    const { query, isLoading, error } = useContext(DuckDBContext);
    return { query, isLoading, error };
  }
  ```

### 1.8 DuckDB Testing
- [ ] Create test page to verify:
  - [ ] DB initialization
  - [ ] SELECT execution
  - [ ] Loading .duckdb file
  - [ ] Exporting .duckdb file
  - [ ] Saving to OPFS
  - [ ] Loading from OPFS after reload

**✅ M1 Completion Criteria:**
- [ ] DuckDB initializes in Web Worker without blocking UI
- [ ] Can load .duckdb file via file input
- [ ] Can execute SELECT and display results
- [ ] Can export database back to .duckdb file
- [ ] Data persists between reloads via OPFS

---

## Milestone 2: Google Drive Integration (2-3 days)

**Goal**: Open/save .duckdb files from/to Google Drive

### 2.1 Google Cloud Project Setup
- [ ] Create project in Google Cloud Console
- [ ] Enable APIs:
  - [ ] Google Drive API
  - [ ] Google Picker API
- [ ] Create OAuth 2.0 credentials:
  - [ ] Application type: Web application
  - [ ] Authorized JavaScript origins: `https://<user>.github.io`
  - [ ] Authorized redirect URIs: `https://<user>.github.io/pm_tester/auth/callback`
- [ ] Obtain Client ID
- [ ] Configure Consent Screen

### 2.2 Application Configuration
- [ ] Create `src/config/google.ts` with CLIENT_ID
- [ ] Create `.env` file (add to .gitignore)
- [ ] Configure Vite env variables

### 2.3 OAuth2 PKCE Flow
- [ ] Create `src/auth/pkce.ts`
  - [ ] `generateCodeVerifier()`
  - [ ] `generateCodeChallenge(verifier)`
- [ ] Create `src/auth/GoogleAuth.tsx`
  - [ ] `buildAuthUrl()`
  - [ ] `exchangeCodeForToken(code, codeVerifier)`
  - [ ] `refreshTokenIfNeeded()`

### 2.4 Auth Context
- [ ] Create `src/context/AuthContext.tsx`
- [ ] Implement:
  ```typescript
  interface AuthContextValue {
    isAuthenticated: boolean;
    accessToken: string | null;
    user: GoogleUser | null;
    signIn: () => void;
    signOut: () => void;
  }
  ```
- [ ] Token storage in localStorage/sessionStorage
- [ ] Automatic session restoration

### 2.5 OAuth Callback Page
- [ ] Create `src/pages/AuthCallbackPage.tsx`
- [ ] Handle `?code=` parameter
- [ ] Exchange code for token
- [ ] Redirect to home

### 2.6 Google Picker
- [ ] Create `src/components/GoogleFilePicker.tsx`
- [ ] Load Google Picker API
- [ ] Implement Picker opening
- [ ] Filter by `.duckdb` files
- [ ] Callback on file selection

### 2.7 Drive API Operations
- [ ] Create `src/drive/api.ts`
- [ ] Create `src/drive/download.ts`
  - [ ] `downloadFile(fileId: string): Promise<ArrayBuffer>`
- [ ] Create `src/drive/upload.ts`
  - [ ] `uploadFile(blob: Blob, filename: string): Promise<string>`
  - [ ] `updateFile(fileId: string, blob: Blob): Promise<void>`

### 2.8 UI Components
- [ ] Create `src/components/GoogleSignInButton.tsx`
- [ ] Create `src/components/SaveToDriveButton.tsx`
- [ ] Create `src/components/OpenFromDriveButton.tsx`

### 2.9 Unsaved Changes Warning
- [x] Create `src/hooks/useBeforeUnload.ts`
- [ ] Create `src/hooks/useUnsavedChanges.ts`
- [ ] Add `hasUnsavedChanges` flag to context
- [ ] Show warning when closing tab

**✅ M2 Completion Criteria:**
- [ ] User can sign in via Google
- [ ] Google Picker opens and allows selecting .duckdb files
- [ ] Selected file downloads and loads into DuckDB WASM
- [ ] Changes can be saved back to the same Drive file
- [ ] beforeunload warns about unsaved changes

---

## Milestone 3: Quiz Engine (3-4 days)

**Goal**: Core quiz-taking functionality

### 3.1 Types & Interfaces
- [x] Create `src/types/quiz.ts`:
  ```typescript
  interface Test { ... }
  interface Question { ... }
  interface Option { ... }
  interface TestGroup { ... }
  interface TestStatistics { ... }
  interface SessionAnswer { ... }
  ```

### 3.2 Database Queries
- [x] Create `src/db/queries/tests.ts`
  - [x] `getAllTests()`
  - [x] `getTestById(id)`
  - [x] `getTestWithQuestions(id)`
  - [x] `deleteTest(id)`
- [x] Create `src/db/queries/groups.ts`
  - [x] `getAllGroups()`
  - [x] `getSubgroupsByGroup(groupId)`
  - [x] `getDifficultyLevelsByGroup(groupId)`
- [x] Create `src/db/queries/statistics.ts`
  - [x] `getStatistics(testId)`
  - [x] `updateStatistics(testId, stats)`

### 3.3 Quiz Business Logic
- [x] Create `src/quiz/evaluate.ts`
  - [x] `evaluateSingleChoice(userAnswer, correctAnswer)`
  - [x] `evaluateMultipleChoice(userAnswers, correctAnswers)`
  - [x] `calculateScore(answers, totalQuestions)`
- [ ] Create `src/quiz/statistics.ts`
  - [ ] `updateTestStatistics(testId, results)`
  - [ ] `calculateAverageScore()`

### 3.4 Session Management
- [x] Create `src/db/queries/session.ts`
  - [x] `saveSessionAnswer(testId, questionId, answer)`
  - [x] `getSessionAnswers(testId)`
  - [x] `clearSession(testId)`
  - [x] `resetMistakesOnly(testId)`

### 3.5 UI Components - Basic
- [x] Create `src/components/QuestionCard.tsx`
  - [x] Question text display (HTML)
  - [x] Image support
- [x] Create `src/components/OptionList.tsx`
  - [x] Radio buttons for single choice
  - [x] Checkboxes for multiple choice
  - [x] "Don't know" option
- [x] Create `src/components/ProgressBar.tsx`
  - [x] Current/total questions
  - [x] Completion percentage

### 3.6 UI Components - Statistics
- [x] Create `src/components/InstantStats.tsx`
  - [x] Correct / Incorrect / Don't know / Unanswered
- [ ] Create `src/components/TestResultsSummary.tsx`
  - [ ] Final percentage
  - [ ] Question-by-question breakdown

### 3.7 TestListPage
- [ ] Implement `src/pages/TestListPage.tsx`
  - [ ] Load test list from DB
  - [ ] Group by groups/subgroups
  - [ ] Display statistics per test
  - [ ] Filter by difficulty level
  - [ ] Search by name

### 3.8 TestModeSelector
- [ ] Implement `src/pages/TestModeSelector.tsx`
  - [ ] Mode selection: Single Page / Instant
  - [ ] Test info
  - [ ] Start buttons

### 3.9 TestSinglePage (Single Page Mode)
- [ ] Implement `src/pages/TestSinglePage.tsx`
  - [ ] Load all questions
  - [ ] Display all questions on one page
  - [ ] Collect answers
  - [ ] Submit button
  - [ ] Navigate to Results

### 3.10 TestInstantPage (Instant Mode)
- [ ] Implement `src/pages/TestInstantPage.tsx`
  - [ ] One question at a time
  - [ ] Immediate answer verification
  - [ ] Show correct answer
  - [ ] Show explanation (if available)
  - [ ] Navigation: Prev / Next
  - [ ] Progress tracking
  - [ ] Save state to DB

### 3.11 TestResultsPage
- [ ] Implement `src/pages/TestResultsPage.tsx`
  - [ ] Final score
  - [ ] Question list with results
  - [ ] Correct/incorrect answers
  - [ ] Buttons: Try Again / Back to Tests

**✅ M3 Completion Criteria:**
- [ ] Test list displays with grouping
- [ ] Can select test mode (single/instant)
- [ ] Single page mode shows all questions and results
- [ ] Instant mode shows one question at a time with immediate feedback
- [ ] "Don't know" works and is excluded from scoring
- [ ] Statistics are saved and displayed

---

## Milestone 4: Test Management UI (2-3 days)

**Goal**: CRUD for tests, groups, questions

### 4.1 Rich Text Editor
- [ ] Install TipTap or Quill
  ```bash
  npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image
  ```
- [ ] Create `src/components/RichTextEditor.tsx`
  - [ ] Toolbar with basic formatting
  - [ ] Image support (Base64)
  - [ ] HTML output

### 4.2 Question Editor Component
- [ ] Create `src/components/QuestionEditor.tsx`
  - [ ] Question text (rich text)
  - [ ] Add/remove options
  - [ ] Mark correct answers
  - [ ] Explanation (rich text)
  - [ ] Drag-and-drop for sorting

### 4.3 DB Mutations
- [x] Create `src/db/mutations/tests.ts`
  - [x] `createTest(test)`
  - [x] `updateTest(id, test)`
  - [x] `deleteTest(id)`
- [x] Create `src/db/mutations/questions.ts`
  - [x] `createQuestion(question)`
  - [x] `updateQuestion(id, question)`
  - [x] `deleteQuestion(id)`
- [x] Create `src/db/mutations/groups.ts`
  - [x] `createGroup(group)`
  - [x] `updateGroup(id, group)`
  - [x] `deleteGroup(id)`

### 4.4 TestCreatePage
- [ ] Implement `src/pages/TestCreatePage.tsx`
  - [ ] Metadata form (name, group, difficulty)
  - [ ] Dynamic question list
  - [ ] Add new questions
  - [ ] Validation before saving
  - [ ] Save to DB

### 4.5 TestEditPage
- [ ] Implement `src/pages/TestEditPage.tsx`
  - [ ] Load existing test
  - [ ] Edit metadata
  - [ ] Edit questions
  - [ ] Delete questions
  - [ ] Save changes

### 4.6 ManageGroupsPage
- [ ] Implement `src/pages/ManageGroupsPage.tsx`
  - [ ] Group list
  - [ ] Create group (name, color, description)
  - [ ] Edit group
  - [ ] Delete group (with dependency check)
  - [ ] Manage subgroups

### 4.7 ManageDifficultyPage
- [ ] Implement `src/pages/ManageDifficultyPage.tsx`
  - [ ] Difficulty levels list by group
  - [ ] CRUD operations

### 4.8 TXT Import Parser
- [ ] Create `src/import/parseQuestions.ts`
  - [ ] Parse format:
    ```
    Question text
    + Correct option
    - Wrong option
    EX: Explanation
    ```
  - [ ] Multi-line text support
  - [ ] Format validation
  - [ ] Return structured data

### 4.9 ImportTestPage
- [ ] Implement `src/pages/ImportTestPage.tsx`
  - [ ] Drag-and-drop zone for files
  - [ ] Preview recognized questions
  - [ ] Edit before saving
  - [ ] Select group and metadata
  - [ ] Save to DB

**✅ M4 Completion Criteria:**
- [ ] Can create new test with questions manually
- [ ] Can edit existing questions
- [ ] Can manage groups and subgroups
- [ ] Can manage difficulty levels
- [ ] Can import TXT file with questions
- [ ] Rich text editor works for questions and explanations

---

## Milestone 5: AI Explanations (1-2 days)

**Goal**: Google Gemini integration for explanations

### 5.1 API Key Management
- [ ] Create `src/pages/SettingsPage.tsx`
- [ ] Form for Gemini API key input
- [ ] Encrypted localStorage storage
- [ ] Key validation

### 5.2 Gemini Client
- [ ] Create `src/ai/gemini.ts`
  - [ ] `generateExplanation(question, options, correctAnswer)`
  - [ ] Prompt template
  - [ ] Error handling
  - [ ] Rate limiting

### 5.3 UI Integration
- [ ] Add "Explain with AI" button to QuestionCard
- [ ] Create `src/components/ExplanationModal.tsx`
  - [ ] Loading state
  - [ ] Display generated explanation
  - [ ] Edit explanation
  - [ ] Save to DB

### 5.4 Explanation Editor
- [ ] Create `src/components/ExplanationEditor.tsx`
  - [ ] Rich text editing
  - [ ] Regenerate button
  - [ ] Save

**✅ M5 Completion Criteria:**
- [ ] "Explain with AI" button generates explanation
- [ ] Explanation can be edited and saved
- [ ] API errors show clear messages

---

## Milestone 6: Data Migration (1 day)

**Goal**: Scripts and documentation for migrating from Flask version

### 6.1 Python Migration Script
- [ ] Create `scripts/migrate.py`
  - [ ] Read old schema
  - [ ] Denormalization → normalization of questions
  - [ ] Migrate all tables
  - [ ] Validate results

### 6.2 Migration Testing
- [ ] Copy `tests.duckdb` from Flask project
- [ ] Run migration
- [ ] Verify in new app:
  - [ ] All tests load
  - [ ] Questions display correctly
  - [ ] Statistics preserved

### 6.3 Documentation
- [ ] Create `docs/MIGRATION.md`
  - [ ] Requirements
  - [ ] Migration steps
  - [ ] Troubleshooting
  - [ ] Rollback on issues

**✅ M6 Completion Criteria:**
- [ ] Migration script converts old schema to new
- [ ] Documentation describes migration steps
- [ ] Migrated data works in new app

---

## Milestone 7: Testing & Polish (2-3 days)

**Goal**: Tests, mobile support, edge cases

### 7.1 Testing Setup
- [ ] Install Vitest
  ```bash
  npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
  ```
- [ ] Configure `vitest.config.ts`
- [ ] Create `src/test/setup.ts`

### 7.2 Unit Tests
- [ ] `src/quiz/__tests__/evaluate.test.ts`
  - [ ] Single choice evaluation
  - [ ] Multiple choice evaluation
  - [ ] Score calculation
  - [ ] Don't know handling
- [ ] `src/import/__tests__/parseQuestions.test.ts`
  - [ ] Valid format parsing
  - [ ] Multi-line support
  - [ ] Error cases

### 7.3 Integration Tests
- [ ] `src/db/__tests__/queries.test.ts`
  - [ ] CRUD operations
  - [ ] Complex queries
- [ ] `src/db/__tests__/session.test.ts`
  - [ ] Session save/load
  - [ ] Reset functions

### 7.4 E2E Tests
- [ ] Install Playwright
  ```bash
  npm install -D @playwright/test
  npx playwright install
  ```
- [ ] Create `e2e/quiz.spec.ts`
  - [ ] Load file → Take test → View results
- [ ] Create `e2e/create-test.spec.ts`
  - [ ] Create test → Edit → Delete

### 7.5 Mobile Responsiveness
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Fix CSS issues:
  - [ ] Navigation menu
  - [ ] Question cards
  - [ ] Buttons and inputs
  - [ ] Modals

### 7.6 Browser Compatibility
- [ ] OPFS fallback for Safari
- [ ] IndexedDB fallback
- [ ] Web Worker support check
- [ ] Graceful degradation messages

### 7.7 Error Handling
- [ ] Create `src/components/ErrorBoundary.tsx`
- [ ] Create `src/components/OfflineIndicator.tsx`
- [ ] Toast notifications for errors
- [ ] Logging for debugging 

### 7.8 Performance
- [ ] Lazy loading pages
- [ ] Code splitting
- [ ] DuckDB WASM lazy load
- [ ] Bundle size optimization

### 7.9 Final Polish
- [ ] Favicon and meta tags
- [ ] Loading states everywhere
- [ ] Empty states
- [ ] 404 page
- [ ] README.md update

**✅ M7 Completion Criteria:**
- [ ] Unit tests pass (>80% coverage on core logic)
- [ ] E2E test passes: load file → take test → save file
- [ ] Works on mobile browsers
- [ ] Graceful degradation when OPFS unavailable
- [ ] Offline state clearly indicated

---

## Post-Launch

### Documentation
- [ ] Update README.md with instructions
- [ ] Add CONTRIBUTING.md
- [ ] Record video demo

### Monitoring
- [ ] Add error tracking (Sentry?)
- [ ] Analytics (if needed)

### Future Improvements
- [ ] PWA manifest for installation
- [ ] Dark theme
- [ ] Keyboard shortcuts
- [ ] Export to PDF
- [ ] Test sharing

---

## Progress

| Milestone | Status | Start Date | Completion Date |
|-----------|--------|------------|-----------------|
| M0: Scaffolding | ✅ Completed | | |
| M1: DuckDB WASM | 🟡 In Progress | | |
| M2: Google Drive | ⬜ Not Started | | |
| M3: Quiz Engine | 🟡 In Progress | | |
| M4: Test Management | 🟡 In Progress | | |
| M5: AI Explanations | ⬜ Not Started | | |
| M6: Migration | ⬜ Not Started | | |
| M7: Testing | ⬜ Not Started | | |

**Legend:**
- ⬜ Not Started
- 🟡 In Progress  
- ✅ Completed
