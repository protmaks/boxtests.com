import { useParams, Link } from 'react-router-dom';

export default function TestEditPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Редактирование теста #{id}</h1>
      <form className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Название теста</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            placeholder="Загрузка..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Группа</label>
          <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
            <option>Загрузка групп...</option>
          </select>
        </div>
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Сохранить
          </button>
          <Link
            to="/tests"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}
