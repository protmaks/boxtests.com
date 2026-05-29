import { Link, useParams } from 'react-router-dom';

export default function TestModeSelector() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Выберите режим теста</h1>
      <div className="grid gap-4">
        <Link
          to={`/test/${id}`}
          className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">Режим одной страницы</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Все вопросы на одной странице. Результат после отправки всех ответов.
          </p>
        </Link>
        <Link
          to={`/test/${id}/instant`}
          className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">Instant режим</h2>
          <p className="text-gray-600 dark:text-gray-400">
            По одному вопросу. Немедленная проверка после каждого ответа.
          </p>
        </Link>
      </div>
      <div className="mt-6 text-center">
        <Link to="/tests" className="text-indigo-600 hover:underline">
          ← Вернуться к списку
        </Link>
      </div>
    </div>
  );
}
