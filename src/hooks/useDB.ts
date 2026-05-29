import { useDuckDB } from '../context/DuckDBContext';

export function useDB() {
  const { query, run, isLoading, error, isInitialized } = useDuckDB();
  return { query, run, isLoading, error, isInitialized };
}
