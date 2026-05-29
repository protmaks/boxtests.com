import { useParams, Link } from 'react-router-dom';

export default function TestSinglePage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Тест #{id}</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Режим одной страницы. Вопросы будут загружены из DuckDB.
        </p>
        <Link
          to={`/test/${id}/results`}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Завершить тест
        </Link>
      </div>
    </div>
  );
}
