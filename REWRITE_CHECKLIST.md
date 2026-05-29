# PM Tester Rewrite Checklist

> Пошаговый чеклист на основе [REWRITE_ROADMAP.md](REWRITE_ROADMAP.md)  
> Отмечай `[x]` при выполнении каждого шага

---

## Milestone 0: Project Scaffolding (1 день)

**Цель**: Создать деплоящийся скелет React-проекта на GitHub Pages

### 0.1 Инициализация проекта
- [ ] Создать директорию проекта
  ```bash
  mkdir pm-tester-web && cd pm-tester-web
  ```
- [ ] Инициализировать Vite + React + TypeScript
  ```bash
  npm create vite@latest . -- --template react-ts
  ```
- [ ] Установить базовые зависимости
  ```bash
  npm install
  ```

### 0.2 Настройка Tailwind CSS
- [ ] Установить Tailwind
  ```bash
  npm install -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p
  ```
- [ ] Настроить `tailwind.config.js`
- [ ] Добавить Tailwind директивы в `src/index.css`

### 0.3 Настройка GitHub Pages
- [ ] Обновить `vite.config.ts` с `base: '/pm_tester/'`
- [ ] Создать `.github/workflows/deploy.yml`
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

### 0.4 Структура директорий
- [ ] Создать структуру папок:
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

### 0.5 Базовый роутинг
- [ ] Установить React Router
  ```bash
  npm install react-router-dom
  ```
- [ ] Создать `src/router.tsx` с маршрутами
- [ ] Обновить `src/App.tsx` с RouterProvider
- [ ] Создать placeholder страницы:
  - [ ] `src/pages/HomePage.tsx`
  - [ ] `src/pages/TestListPage.tsx`
  - [ ] `src/pages/TestModeSelector.tsx`
  - [ ] `src/pages/TestSinglePage.tsx`
  - [ ] `src/pages/TestInstantPage.tsx`
  - [ ] `src/pages/TestResultsPage.tsx`
  - [ ] `src/pages/TestCreatePage.tsx`
  - [ ] `src/pages/TestEditPage.tsx`
  - [ ] `src/pages/ManageGroupsPage.tsx`
  - [ ] `src/pages/ManageDifficultyPage.tsx`

### 0.6 Первый деплой
- [ ] Создать Git репозиторий
  ```bash
  git init
  git add .
  git commit -m "Initial commit: Vite + React + TypeScript"
  ```
- [ ] Пушить на GitHub
- [ ] Проверить GitHub Actions деплой
- [ ] Проверить работу на `https://<user>.github.io/pm_tester/`

**✅ Критерии завершения M0:**
- [ ] `npm run build` создаёт рабочий билд
- [ ] GitHub Actions деплоит на GitHub Pages
- [ ] Все placeholder роуты рендерятся

---

## Milestone 1: DuckDB WASM Core (2-3 дня)

**Цель**: DuckDB WASM работает в Web Worker с импортом/экспортом файлов

### 1.1 Установка DuckDB WASM
- [ ] Установить пакет
  ```bash
  npm install @duckdb/duckdb-wasm
  ```
- [ ] Скопировать WASM файлы в `public/duckdb/`
  ```bash
  mkdir -p public/duckdb
  cp node_modules/@duckdb/duckdb-wasm/dist/*.wasm public/duckdb/
  cp node_modules/@duckdb/duckdb-wasm/dist/*.worker.js public/duckdb/
  ```

### 1.2 Web Worker для DuckDB
- [ ] Создать `src/workers/duckdb.worker.ts`
- [ ] Настроить Vite для Web Workers (vite.config.ts)
- [ ] Реализовать message passing протокол:
  - [ ] `INIT` - инициализация DB
  - [ ] `QUERY` - выполнение SQL
  - [ ] `IMPORT` - загрузка .duckdb файла
  - [ ] `EXPORT` - экспорт .duckdb файла

### 1.3 DuckDB Context Provider
- [ ] Создать `src/context/DuckDBContext.tsx`
- [ ] Реализовать интерфейс:
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
- [ ] Добавить Provider в App.tsx

### 1.4 Схема базы данных
- [ ] Создать `src/db/schema.ts` с DDL
- [ ] Реализовать `initializeSchema()` функцию
- [ ] Таблицы:
  - [ ] `tests`
  - [ ] `questions`
  - [ ] `question_options`
  - [ ] `test_groups`
  - [ ] `test_subgroups`
  - [ ] `difficulty_levels`
  - [ ] `test_statistics`
  - [ ] `session_answers`
  - [ ] `media_blobs`
- [ ] Индексы

### 1.5 Импорт/Экспорт файлов
- [ ] Создать `src/db/import.ts`
  - [ ] `importFromArrayBuffer(buffer: ArrayBuffer)`
  - [ ] `importFromFile(file: File)`
- [ ] Создать `src/db/export.ts`
  - [ ] `exportToArrayBuffer(): ArrayBuffer`
  - [ ] `exportToBlob(): Blob`
  - [ ] `downloadAsFile(filename: string)`

### 1.6 OPFS Persistence
- [ ] Создать `src/db/opfs.ts`
- [ ] Реализовать:
  - [ ] `saveToOPFS(db: ArrayBuffer)`
  - [ ] `loadFromOPFS(): ArrayBuffer | null`
  - [ ] `hasOPFSSupport(): boolean`
- [ ] Fallback на IndexedDB если OPFS недоступен

### 1.7 useDB Hook
- [ ] Создать `src/hooks/useDB.ts`
- [ ] Реализовать:
  ```typescript
  function useDB() {
    const { query, isLoading, error } = useContext(DuckDBContext);
    return { query, isLoading, error };
  }
  ```

### 1.8 Тестирование DuckDB
- [ ] Создать тестовую страницу для проверки:
  - [ ] Инициализация DB
  - [ ] Выполнение SELECT
  - [ ] Загрузка .duckdb файла
  - [ ] Экспорт .duckdb файла
  - [ ] Сохранение в OPFS
  - [ ] Загрузка из OPFS после перезагрузки

**✅ Критерии завершения M1:**
- [ ] DuckDB инициализируется в Web Worker без блокировки UI
- [ ] Можно загрузить .duckdb файл через file input
- [ ] Можно выполнить SELECT и отобразить результаты
- [ ] Можно экспортировать базу обратно в .duckdb файл
- [ ] Данные сохраняются между перезагрузками через OPFS

---

## Milestone 2: Google Drive Integration (2-3 дня)

**Цель**: Открытие/сохранение .duckdb файлов в Google Drive

### 2.1 Google Cloud Project Setup
- [ ] Создать проект в Google Cloud Console
- [ ] Включить APIs:
  - [ ] Google Drive API
  - [ ] Google Picker API
- [ ] Создать OAuth 2.0 credentials:
  - [ ] Application type: Web application
  - [ ] Authorized JavaScript origins: `https://<user>.github.io`
  - [ ] Authorized redirect URIs: `https://<user>.github.io/pm_tester/auth/callback`
- [ ] Получить Client ID
- [ ] Настроить Consent Screen

### 2.2 Конфигурация приложения
- [ ] Создать `src/config/google.ts` с CLIENT_ID
- [ ] Создать `.env` файл (добавить в .gitignore)
- [ ] Настроить Vite env variables

### 2.3 OAuth2 PKCE Flow
- [ ] Создать `src/auth/pkce.ts`
  - [ ] `generateCodeVerifier()`
  - [ ] `generateCodeChallenge(verifier)`
- [ ] Создать `src/auth/GoogleAuth.tsx`
  - [ ] `buildAuthUrl()`
  - [ ] `exchangeCodeForToken(code, codeVerifier)`
  - [ ] `refreshTokenIfNeeded()`

### 2.4 Auth Context
- [ ] Создать `src/context/AuthContext.tsx`
- [ ] Реализовать:
  ```typescript
  interface AuthContextValue {
    isAuthenticated: boolean;
    accessToken: string | null;
    user: GoogleUser | null;
    signIn: () => void;
    signOut: () => void;
  }
  ```
- [ ] Хранение токена в localStorage/sessionStorage
- [ ] Автоматическое восстановление сессии

### 2.5 OAuth Callback Page
- [ ] Создать `src/pages/AuthCallbackPage.tsx`
- [ ] Обработка `?code=` параметра
- [ ] Обмен кода на токен
- [ ] Редирект на главную

### 2.6 Google Picker
- [ ] Создать `src/components/GoogleFilePicker.tsx`
- [ ] Загрузить Google Picker API
- [ ] Реализовать открытие Picker
- [ ] Фильтр по `.duckdb` файлам
- [ ] Callback при выборе файла

### 2.7 Drive API Operations
- [ ] Создать `src/drive/api.ts`
- [ ] Создать `src/drive/download.ts`
  - [ ] `downloadFile(fileId: string): Promise<ArrayBuffer>`
- [ ] Создать `src/drive/upload.ts`
  - [ ] `uploadFile(blob: Blob, filename: string): Promise<string>`
  - [ ] `updateFile(fileId: string, blob: Blob): Promise<void>`

### 2.8 UI Компоненты
- [ ] Создать `src/components/GoogleSignInButton.tsx`
- [ ] Создать `src/components/SaveToDriveButton.tsx`
- [ ] Создать `src/components/OpenFromDriveButton.tsx`

### 2.9 Unsaved Changes Warning
- [ ] Создать `src/hooks/useBeforeUnload.ts`
- [ ] Создать `src/hooks/useUnsavedChanges.ts`
- [ ] Добавить флаг `hasUnsavedChanges` в контекст
- [ ] Показывать предупреждение при закрытии вкладки

**✅ Критерии завершения M2:**
- [ ] Пользователь может войти через Google
- [ ] Google Picker открывается и позволяет выбрать .duckdb файлы
- [ ] Выбранный файл скачивается и загружается в DuckDB WASM
- [ ] Изменения можно сохранить обратно в тот же файл на Drive
- [ ] beforeunload предупреждает о несохранённых изменениях

---

## Milestone 3: Quiz Engine (3-4 дня)

**Цель**: Основной функционал прохождения тестов

### 3.1 Types & Interfaces
- [ ] Создать `src/types/quiz.ts`:
  ```typescript
  interface Test { ... }
  interface Question { ... }
  interface Option { ... }
  interface TestGroup { ... }
  interface TestStatistics { ... }
  interface SessionAnswer { ... }
  ```

### 3.2 Database Queries
- [ ] Создать `src/db/queries/tests.ts`
  - [ ] `getAllTests()`
  - [ ] `getTestById(id)`
  - [ ] `getTestWithQuestions(id)`
  - [ ] `deleteTest(id)`
- [ ] Создать `src/db/queries/groups.ts`
  - [ ] `getAllGroups()`
  - [ ] `getSubgroupsByGroup(groupId)`
  - [ ] `getDifficultyLevelsByGroup(groupId)`
- [ ] Создать `src/db/queries/statistics.ts`
  - [ ] `getStatistics(testId)`
  - [ ] `updateStatistics(testId, stats)`

### 3.3 Quiz Business Logic
- [ ] Создать `src/quiz/evaluate.ts`
  - [ ] `evaluateSingleChoice(userAnswer, correctAnswer)`
  - [ ] `evaluateMultipleChoice(userAnswers, correctAnswers)`
  - [ ] `calculateScore(answers, totalQuestions)`
- [ ] Создать `src/quiz/statistics.ts`
  - [ ] `updateTestStatistics(testId, results)`
  - [ ] `calculateAverageScore()`

### 3.4 Session Management
- [ ] Создать `src/db/queries/session.ts`
  - [ ] `saveSessionAnswer(testId, questionId, answer)`
  - [ ] `getSessionAnswers(testId)`
  - [ ] `clearSession(testId)`
  - [ ] `resetMistakesOnly(testId)`

### 3.5 UI Компоненты - Базовые
- [ ] Создать `src/components/QuestionCard.tsx`
  - [ ] Отображение текста вопроса (HTML)
  - [ ] Поддержка изображений
- [ ] Создать `src/components/OptionList.tsx`
  - [ ] Radio buttons для single choice
  - [ ] Checkboxes для multiple choice
  - [ ] "Не знаю" опция
- [ ] Создать `src/components/ProgressBar.tsx`
  - [ ] Текущий/всего вопросов
  - [ ] Процент завершения

### 3.6 UI Компоненты - Статистика
- [ ] Создать `src/components/InstantStats.tsx`
  - [ ] Правильные / Неправильные / Не знаю / Без ответа
- [ ] Создать `src/components/TestResultsSummary.tsx`
  - [ ] Итоговый процент
  - [ ] Детализация по вопросам

### 3.7 TestListPage
- [ ] Реализовать `src/pages/TestListPage.tsx`
  - [ ] Загрузка списка тестов из DB
  - [ ] Группировка по группам/подгруппам
  - [ ] Отображение статистики для каждого теста
  - [ ] Фильтрация по уровню сложности
  - [ ] Поиск по названию

### 3.8 TestModeSelector
- [ ] Реализовать `src/pages/TestModeSelector.tsx`
  - [ ] Выбор режима: Single Page / Instant
  - [ ] Информация о тесте
  - [ ] Кнопки старта

### 3.9 TestSinglePage (Single Page Mode)
- [ ] Реализовать `src/pages/TestSinglePage.tsx`
  - [ ] Загрузка всех вопросов
  - [ ] Отображение всех вопросов на одной странице
  - [ ] Сбор ответов
  - [ ] Кнопка Submit
  - [ ] Переход на Results

### 3.10 TestInstantPage (Instant Mode)
- [ ] Реализовать `src/pages/TestInstantPage.tsx`
  - [ ] Один вопрос за раз
  - [ ] Немедленная проверка ответа
  - [ ] Показ правильного ответа
  - [ ] Показ explanation (если есть)
  - [ ] Навигация: Prev / Next
  - [ ] Progress tracking
  - [ ] Сохранение состояния в DB

### 3.11 TestResultsPage
- [ ] Реализовать `src/pages/TestResultsPage.tsx`
  - [ ] Итоговый score
  - [ ] Список вопросов с результатами
  - [ ] Правильные/неправильные ответы
  - [ ] Кнопки: Try Again / Back to Tests

**✅ Критерии завершения M3:**
- [ ] Список тестов отображается с группировкой
- [ ] Можно выбрать режим теста (single/instant)
- [ ] Single page режим показывает все вопросы и результаты
- [ ] Instant режим показывает по одному вопросу с немедленной проверкой
- [ ] "Не знаю" работает и исключается из подсчёта
- [ ] Статистика сохраняется и отображается

---

## Milestone 4: Test Management UI (2-3 дня)

**Цель**: CRUD для тестов, групп, вопросов

### 4.1 Rich Text Editor
- [ ] Установить TipTap или Quill
  ```bash
  npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image
  ```
- [ ] Создать `src/components/RichTextEditor.tsx`
  - [ ] Toolbar с базовым форматированием
  - [ ] Поддержка изображений (Base64)
  - [ ] HTML output

### 4.2 Question Editor Component
- [ ] Создать `src/components/QuestionEditor.tsx`
  - [ ] Текст вопроса (rich text)
  - [ ] Добавление/удаление options
  - [ ] Отметка правильных ответов
  - [ ] Explanation (rich text)
  - [ ] Drag-and-drop для сортировки

### 4.3 DB Mutations
- [ ] Создать `src/db/mutations/tests.ts`
  - [ ] `createTest(test)`
  - [ ] `updateTest(id, test)`
  - [ ] `deleteTest(id)`
- [ ] Создать `src/db/mutations/questions.ts`
  - [ ] `createQuestion(question)`
  - [ ] `updateQuestion(id, question)`
  - [ ] `deleteQuestion(id)`
- [ ] Создать `src/db/mutations/groups.ts`
  - [ ] `createGroup(group)`
  - [ ] `updateGroup(id, group)`
  - [ ] `deleteGroup(id)`

### 4.4 TestCreatePage
- [ ] Реализовать `src/pages/TestCreatePage.tsx`
  - [ ] Форма метаданных (название, группа, сложность)
  - [ ] Динамический список вопросов
  - [ ] Добавление новых вопросов
  - [ ] Валидация перед сохранением
  - [ ] Сохранение в DB

### 4.5 TestEditPage
- [ ] Реализовать `src/pages/TestEditPage.tsx`
  - [ ] Загрузка существующего теста
  - [ ] Редактирование метаданных
  - [ ] Редактирование вопросов
  - [ ] Удаление вопросов
  - [ ] Сохранение изменений

### 4.6 ManageGroupsPage
- [ ] Реализовать `src/pages/ManageGroupsPage.tsx`
  - [ ] Список групп
  - [ ] Создание группы (название, цвет, описание)
  - [ ] Редактирование группы
  - [ ] Удаление группы (с проверкой зависимостей)
  - [ ] Управление подгруппами

### 4.7 ManageDifficultyPage
- [ ] Реализовать `src/pages/ManageDifficultyPage.tsx`
  - [ ] Список уровней сложности по группам
  - [ ] CRUD операции

### 4.8 TXT Import Parser
- [ ] Создать `src/import/parseQuestions.ts`
  - [ ] Парсинг формата:
    ```
    Question text
    + Correct option
    - Wrong option
    EX: Explanation
    ```
  - [ ] Поддержка multi-line текста
  - [ ] Валидация формата
  - [ ] Возврат структурированных данных

### 4.9 ImportTestPage
- [ ] Реализовать `src/pages/ImportTestPage.tsx`
  - [ ] Drag-and-drop зона для файлов
  - [ ] Предпросмотр распознанных вопросов
  - [ ] Редактирование перед сохранением
  - [ ] Выбор группы и метаданных
  - [ ] Сохранение в DB

**✅ Критерии завершения M4:**
- [ ] Можно создать новый тест с вопросами вручную
- [ ] Можно редактировать существующие вопросы
- [ ] Можно управлять группами и подгруппами
- [ ] Можно управлять уровнями сложности
- [ ] Можно импортировать TXT файл с вопросами
- [ ] Rich text editor работает для вопросов и explanations

---

## Milestone 5: AI Explanations (1-2 дня)

**Цель**: Интеграция Google Gemini для объяснений

### 5.1 API Key Management
- [ ] Создать `src/pages/SettingsPage.tsx`
- [ ] Форма для ввода Gemini API ключа
- [ ] Сохранение в localStorage (зашифрованное)
- [ ] Валидация ключа

### 5.2 Gemini Client
- [ ] Создать `src/ai/gemini.ts`
  - [ ] `generateExplanation(question, options, correctAnswer)`
  - [ ] Prompt template
  - [ ] Error handling
  - [ ] Rate limiting

### 5.3 UI Integration
- [ ] Добавить кнопку "Explain with AI" в QuestionCard
- [ ] Создать `src/components/ExplanationModal.tsx`
  - [ ] Loading state
  - [ ] Отображение сгенерированного объяснения
  - [ ] Редактирование объяснения
  - [ ] Сохранение в DB

### 5.4 Explanation Editor
- [ ] Создать `src/components/ExplanationEditor.tsx`
  - [ ] Rich text редактирование
  - [ ] Кнопка регенерации
  - [ ] Сохранение

**✅ Критерии завершения M5:**
- [ ] Кнопка "Explain with AI" генерирует объяснение
- [ ] Объяснение можно редактировать и сохранить
- [ ] Ошибки API показывают понятные сообщения

---

## Milestone 6: Data Migration (1 день)

**Цель**: Скрипты и документация для миграции из Flask версии

### 6.1 Python Migration Script
- [ ] Создать `scripts/migrate.py`
  - [ ] Чтение старой схемы
  - [ ] Денормализация → нормализация вопросов
  - [ ] Миграция всех таблиц
  - [ ] Валидация результатов

### 6.2 Тестирование миграции
- [ ] Скопировать `tests.duckdb` из Flask проекта
- [ ] Запустить миграцию
- [ ] Проверить в новом приложении:
  - [ ] Все тесты загружаются
  - [ ] Вопросы отображаются корректно
  - [ ] Статистика сохранилась

### 6.3 Документация
- [ ] Создать `docs/MIGRATION.md`
  - [ ] Требования
  - [ ] Шаги миграции
  - [ ] Troubleshooting
  - [ ] Откат при проблемах

**✅ Критерии завершения M6:**
- [ ] Скрипт миграции конвертирует старую схему в новую
- [ ] Документация описывает шаги миграции
- [ ] Мигрированные данные работают в новом приложении

---

## Milestone 7: Testing & Polish (2-3 дня)

**Цель**: Тесты, мобильная поддержка, edge cases

### 7.1 Testing Setup
- [ ] Установить Vitest
  ```bash
  npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
  ```
- [ ] Настроить `vitest.config.ts`
- [ ] Создать `src/test/setup.ts`

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
- [ ] Установить Playwright
  ```bash
  npm install -D @playwright/test
  npx playwright install
  ```
- [ ] Создать `e2e/quiz.spec.ts`
  - [ ] Load file → Take test → View results
- [ ] Создать `e2e/create-test.spec.ts`
  - [ ] Create test → Edit → Delete

### 7.5 Mobile Responsiveness
- [ ] Проверить на iOS Safari
- [ ] Проверить на Android Chrome
- [ ] Исправить CSS issues:
  - [ ] Navigation меню
  - [ ] Question cards
  - [ ] Buttons и inputs
  - [ ] Modals

### 7.6 Browser Compatibility
- [ ] OPFS fallback для Safari
- [ ] IndexedDB fallback
- [ ] Проверка Web Worker support
- [ ] Graceful degradation сообщения

### 7.7 Error Handling
- [ ] Создать `src/components/ErrorBoundary.tsx`
- [ ] Создать `src/components/OfflineIndicator.tsx`
- [ ] Toast notifications для ошибок
- [ ] Logging для debugging

### 7.8 Performance
- [ ] Lazy loading страниц
- [ ] Code splitting
- [ ] DuckDB WASM lazy load
- [ ] Оптимизация bundle size

### 7.9 Final Polish
- [ ] Favicon и meta tags
- [ ] Loading states везде
- [ ] Empty states
- [ ] 404 страница
- [ ] README.md обновление

**✅ Критерии завершения M7:**
- [ ] Unit тесты проходят (>80% coverage на core logic)
- [ ] E2E тест проходит: load file → take test → save file
- [ ] Работает на мобильных браузерах
- [ ] Graceful degradation когда OPFS недоступен
- [ ] Offline состояние чётко индицируется

---

## Post-Launch

### Документация
- [ ] Обновить README.md с инструкциями
- [ ] Добавить CONTRIBUTING.md
- [ ] Записать видео-демо

### Monitoring
- [ ] Добавить error tracking (Sentry?)
- [ ] Analytics (если нужно)

### Future Improvements
- [ ] PWA манифест для установки
- [ ] Темная тема
- [ ] Keyboard shortcuts
- [ ] Export в PDF
- [ ] Sharing тестов

---

## Прогресс

| Milestone | Статус | Дата начала | Дата завершения |
|-----------|--------|-------------|-----------------|
| M0: Scaffolding | ⬜ Not Started | | |
| M1: DuckDB WASM | ⬜ Not Started | | |
| M2: Google Drive | ⬜ Not Started | | |
| M3: Quiz Engine | ⬜ Not Started | | |
| M4: Test Management | ⬜ Not Started | | |
| M5: AI Explanations | ⬜ Not Started | | |
| M6: Migration | ⬜ Not Started | | |
| M7: Testing | ⬜ Not Started | | |

**Легенда:**
- ⬜ Not Started
- 🟡 In Progress  
- ✅ Completed
