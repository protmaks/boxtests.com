import { Link } from 'react-router-dom';

export default function ManageDifficultyPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Уровни сложности</h1>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          + Добавить уровень
        </button>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          Уровни сложности будут загружены из DuckDB.
        </div>
      </div>
      <div className="mt-6">
        <Link to="/tests" className="text-indigo-600 hover:underline">
          ← Вернуться к тестам
        </Link>
      </div>
    </div>
  );
}
