import { Link } from 'react-router-dom';

export default function TestListPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Мои тесты</h1>
        <Link
          to="/create"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          + Создать тест
        </Link>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Пока нет тестов. Создайте первый тест или загрузите .duckdb файл.
        </p>
      </div>
    </div>
  );
}
