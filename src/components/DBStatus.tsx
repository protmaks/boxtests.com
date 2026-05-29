import { useDuckDB } from '../context/DuckDBContext';

export function DBStatus() {
  const { isLoading, error, isInitialized } = useDuckDB();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        Loading DuckDB...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500">
        ❌ Error: {error.message}
      </div>
    );
  }

  if (isInitialized) {
    return (
      <div className="text-sm text-green-600">
        ✓ DuckDB ready
      </div>
    );
  }

  return null;
}
