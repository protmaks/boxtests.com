import { Outlet, Link } from 'react-router-dom';

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-indigo-600">
            PM Tester
          </Link>
          <div className="flex gap-6">
            <Link
              to="/tests"
              className="text-gray-600 dark:text-gray-300 hover:text-indigo-600"
            >
              Тесты
            </Link>
            <Link
              to="/manage/groups"
              className="text-gray-600 dark:text-gray-300 hover:text-indigo-600"
            >
              Группы
            </Link>
            <Link
              to="/manage/difficulty"
              className="text-gray-600 dark:text-gray-300 hover:text-indigo-600"
            >
              Сложность
            </Link>
          </div>
        </nav>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full">
        <Outlet />
      </main>
      <footer className="bg-gray-100 dark:bg-gray-800 py-4 text-center text-sm text-gray-500">
        PM Tester © 2024 — React + DuckDB WASM
      </footer>
    </div>
  );
}

export default App;
