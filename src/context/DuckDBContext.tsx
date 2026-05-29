import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';
import { initializeSchema } from '../db/schema';

interface DuckDBContextValue {
  db: duckdb.AsyncDuckDB | null;
  conn: duckdb.AsyncDuckDBConnection | null;
  isLoading: boolean;
  error: Error | null;
  isInitialized: boolean;
  query: <T = Record<string, unknown>>(sql: string) => Promise<T[]>;
  run: (sql: string) => Promise<void>;
  importFromFile: (file: File) => Promise<void>;
  exportToBlob: () => Promise<Blob>;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
}

const DuckDBContext = createContext<DuckDBContextValue | null>(null);

const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

export function DuckDBProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<duckdb.AsyncDuckDB | null>(null);
  const [conn, setConn] = useState<duckdb.AsyncDuckDBConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initDB() {
      try {
        const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
        const worker_url = URL.createObjectURL(
          new Blob([`importScripts("${bundle.mainWorker!}");`], {
            type: 'text/javascript',
          })
        );

        const worker = new Worker(worker_url);
        const logger = new duckdb.ConsoleLogger();
        const database = new duckdb.AsyncDuckDB(logger, worker);
        await database.instantiate(bundle.mainModule, bundle.pthreadWorker);

        URL.revokeObjectURL(worker_url);

        if (!mounted) {
          await database.terminate();
          return;
        }

        const connection = await database.connect();

        // Try to load from OPFS first
        const loaded = await tryLoadFromOPFS(database, connection);
        if (!loaded) {
          // Initialize fresh schema
          await initializeSchema({ run: (sql) => connection.query(sql).then(() => {}) });
        }

        if (mounted) {
          setDb(database);
          setConn(connection);
          setIsInitialized(true);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      }
    }

    initDB();

    return () => {
      mounted = false;
    };
  }, []);

  const query = useCallback(
    async <T = Record<string, unknown>>(sql: string): Promise<T[]> => {
      if (!conn) throw new Error('Database not initialized');
      const result = await conn.query(sql);
      return result.toArray().map((row) => row.toJSON() as T);
    },
    [conn]
  );

  const run = useCallback(
    async (sql: string): Promise<void> => {
      if (!conn) throw new Error('Database not initialized');
      await conn.query(sql);
      setHasUnsavedChanges(true);
    },
    [conn]
  );

  const importFromFile = useCallback(
    async (file: File): Promise<void> => {
      if (!db || !conn) throw new Error('Database not initialized');

      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);

      await conn.close();
      await db.dropFile('data.duckdb').catch(() => {});
      await db.registerFileBuffer('data.duckdb', uint8Array);
      await db.open({ path: 'data.duckdb' });

      const newConn = await db.connect();
      setConn(newConn);
      setHasUnsavedChanges(false);

      // Save to OPFS
      await saveToOPFS(db);
    },
    [db, conn]
  );

  const exportToBlob = useCallback(async (): Promise<Blob> => {
    if (!db) throw new Error('Database not initialized');

    await db.flushFiles();
    const buffer = await db.copyFileToBuffer('data.duckdb');
    setHasUnsavedChanges(false);

    // Save to OPFS
    await saveToOPFS(db);

    // Convert to ArrayBuffer for Blob compatibility
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
    return new Blob([arrayBuffer], { type: 'application/octet-stream' });
  }, [db]);

  return (
    <DuckDBContext.Provider
      value={{
        db,
        conn,
        isLoading,
        error,
        isInitialized,
        query,
        run,
        importFromFile,
        exportToBlob,
        hasUnsavedChanges,
        setHasUnsavedChanges,
      }}
    >
      {children}
    </DuckDBContext.Provider>
  );
}

export function useDuckDB(): DuckDBContextValue {
  const context = useContext(DuckDBContext);
  if (!context) {
    throw new Error('useDuckDB must be used within a DuckDBProvider');
  }
  return context;
}

// OPFS helpers
async function tryLoadFromOPFS(
  _db: duckdb.AsyncDuckDB,
  _conn: duckdb.AsyncDuckDBConnection
): Promise<boolean> {
  if (!('storage' in navigator) || !('getDirectory' in navigator.storage)) {
    return false;
  }

  try {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle('pm_tester.duckdb', { create: false });
    const file = await fileHandle.getFile();
    const buffer = await file.arrayBuffer();

    if (buffer.byteLength === 0) {
      return false;
    }

    // File exists but we'll load it via importFromFile pattern
    console.log('Found existing database in OPFS');
    return false; // For now, always start fresh - TODO: implement proper loading
  } catch {
    return false;
  }
}

async function saveToOPFS(db: duckdb.AsyncDuckDB): Promise<void> {
  if (!('storage' in navigator) || !('getDirectory' in navigator.storage)) {
    console.warn('OPFS not supported');
    return;
  }

  try {
    await db.flushFiles();
    const buffer = await db.copyFileToBuffer('data.duckdb').catch(() => null);
    if (!buffer) return;

    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle('pm_tester.duckdb', { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(new Uint8Array(buffer).buffer.slice(0));
    await writable.close();
    console.log('Saved to OPFS');
  } catch (err) {
    console.error('Failed to save to OPFS:', err);
  }
}
