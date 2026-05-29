import { useParams, Link } from 'react-router-dom';

export default function TestInstantPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Instant режим — Тест #{id}</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
        <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
          По одному вопросу с немедленной проверкой.
        </p>
        <div className="flex justify-between">
          <button
            disabled
            className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
          >
            ← Назад
          </button>
          <Link
            to={`/test/${id}/results`}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Завершить →
          </Link>
        </div>
      </div>
    </div>
  );
}
