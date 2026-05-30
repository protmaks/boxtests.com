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
  cacheSize: number | null;
  clearCache: () => Promise<void>;
  refreshCacheSize: () => Promise<void>;
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
  const [cacheSize, setCacheSize] = useState<number | null>(null);

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
        const logger = new duckdb.VoidLogger();
        const database = new duckdb.AsyncDuckDB(logger, worker);
        await database.instantiate(bundle.mainModule, bundle.pthreadWorker);

        URL.revokeObjectURL(worker_url);

        if (!mounted) {
          await database.terminate();
          return;
        }

        // Try to load from OPFS first
        const loadedConn = await tryLoadFromOPFS(database);
        
        let connection: duckdb.AsyncDuckDBConnection;
        if (loadedConn) {
          // Use connection from loaded database
          connection = loadedConn;
        } else {
          // Create fresh connection and initialize schema
          connection = await database.connect();
          await initializeSchema({ run: (sql) => connection.query(sql).then(() => {}) });
        }

        if (mounted) {
          setDb(database);
          setConn(connection);
          setIsInitialized(true);
          setIsLoading(false);
          // Refresh cache size after initialization
          getOPFSCacheSize().then(setCacheSize).catch(() => setCacheSize(null));
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

      // Flush any pending writes first
      await db.flushFiles();
      
      // Close connection
      await conn.close();
      
      // Close the database to release WAL lock
      await db.open({ path: ':memory:' });
      
      // Now drop the old files
      await db.dropFile('data.duckdb').catch(() => {});
      await db.dropFile('data.duckdb.wal').catch(() => {});
      
      // Register and open new file
      await db.registerFileBuffer('data.duckdb', uint8Array);
      await db.open({
        path: 'data.duckdb',
        accessMode: duckdb.DuckDBAccessMode.READ_WRITE,
      });

      const newConn = await db.connect();
      setConn(newConn);
      setHasUnsavedChanges(false);

      // Save to OPFS
      await saveToOPFS(db, newConn);
      // Refresh cache size
      const size = await getOPFSCacheSize();
      setCacheSize(size);
    },
    [db, conn]
  );

  const exportToBlob = useCallback(async (): Promise<Blob> => {
    if (!db || !conn) throw new Error('Database not initialized');

    // Force checkpoint to write WAL data to main file
    await conn.query('CHECKPOINT');
    await db.flushFiles();
    
    const buffer = await db.copyFileToBuffer('data.duckdb');
    setHasUnsavedChanges(false);

    // Save to OPFS (checkpoint already done)
    await saveToOPFS(db);
    // Refresh cache size
    const size = await getOPFSCacheSize();
    setCacheSize(size);

    // Convert to ArrayBuffer for Blob compatibility
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
    return new Blob([arrayBuffer], { type: 'application/octet-stream' });
  }, [db, conn]);

  const refreshCacheSize = useCallback(async (): Promise<void> => {
    const size = await getOPFSCacheSize();
    setCacheSize(size);
  }, []);

  const clearCache = useCallback(async (): Promise<void> => {
    if (!db || !conn) throw new Error('Database not initialized');

    // Clear OPFS
    await clearOPFSCache();
    setCacheSize(null);

    // Reset database: close connection, drop files, reinitialize schema
    await conn.close();
    await db.open({ path: ':memory:' });
    await db.dropFile('data.duckdb').catch(() => {});
    await db.dropFile('data.duckdb.wal').catch(() => {});

    // Reinitialize with fresh schema
    const newConn = await db.connect();
    await initializeSchema({ run: (sql) => newConn.query(sql).then(() => {}) });
    setConn(newConn);
    setHasUnsavedChanges(false);
  }, [db, conn]);

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
        cacheSize,
        clearCache,
        refreshCacheSize,
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
  db: duckdb.AsyncDuckDB
): Promise<duckdb.AsyncDuckDBConnection | null> {
  if (!('storage' in navigator) || !('getDirectory' in navigator.storage)) {
    return null;
  }

  try {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle('pm_tester.duckdb', { create: false });
    const file = await fileHandle.getFile();
    const buffer = await file.arrayBuffer();

    if (buffer.byteLength === 0) {
      return null;
    }

    // Load the database from OPFS
    const uint8Array = new Uint8Array(buffer);
    await db.registerFileBuffer('data.duckdb', uint8Array);
    await db.open({
      path: 'data.duckdb',
      accessMode: duckdb.DuckDBAccessMode.READ_WRITE,
    });

    // Create connection to the loaded database
    const connection = await db.connect();
    console.log('Loaded database from OPFS, size:', buffer.byteLength, 'bytes');
    return connection;
  } catch (err) {
    console.warn('Failed to load from OPFS:', err);
    return null;
  }
}

async function saveToOPFS(db: duckdb.AsyncDuckDB, conn?: duckdb.AsyncDuckDBConnection | null): Promise<void> {
  if (!('storage' in navigator) || !('getDirectory' in navigator.storage)) {
    console.warn('OPFS not supported');
    return;
  }

  try {
    // Force checkpoint if connection is available
    if (conn) {
      await conn.query('CHECKPOINT');
    }
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

async function getOPFSCacheSize(): Promise<number | null> {
  if (!('storage' in navigator) || !('getDirectory' in navigator.storage)) {
    return null;
  }

  try {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle('pm_tester.duckdb', { create: false });
    const file = await fileHandle.getFile();
    return file.size;
  } catch {
    return null;
  }
}

async function clearOPFSCache(): Promise<void> {
  if (!('storage' in navigator) || !('getDirectory' in navigator.storage)) {
    return;
  }

  try {
    const root = await navigator.storage.getDirectory();
    await root.removeEntry('pm_tester.duckdb');
    console.log('Cleared OPFS cache');
  } catch (err) {
    console.warn('Failed to clear OPFS cache:', err);
  }
}
