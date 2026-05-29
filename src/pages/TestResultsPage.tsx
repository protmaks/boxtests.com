import { useParams, Link } from 'react-router-dom';

export default function TestResultsPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Результаты теста #{id}</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <div className="text-6xl font-bold text-indigo-600 mb-4">—%</div>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Результаты будут отображаться после интеграции с DuckDB.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            to={`/test/${id}/mode`}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Пройти снова
          </Link>
          <Link
            to="/tests"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            К списку тестов
          </Link>
        </div>
      </div>
    </div>
  );
}
