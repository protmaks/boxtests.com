import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
        PM Tester
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md text-center">
        Приложение для самотестирования. Создавайте тесты, проходите их и
        отслеживайте прогресс.
      </p>
      <div className="flex gap-4">
        <Link
          to="/tests"
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Мои тесты
        </Link>
        <Link
          to="/create"
          className="px-6 py-3 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
        >
          Создать тест
        </Link>
      </div>
    </div>
  );
}
