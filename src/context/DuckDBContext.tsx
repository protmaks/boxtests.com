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
          // console.log('Using existing database from OPFS');
        } else {
          // Create fresh file-backed database from template
          // Clean up any old/corrupted files first
          await database.dropFile('data.duckdb').catch(() => {});
          await database.dropFile('data.duckdb.wal').catch(() => {});
          // console.log('Cleaned up old database files');
          
          // Try to load template database
          let templateConnection: duckdb.AsyncDuckDBConnection | null = null;
          try {
            // console.log('Fetching template database...');
            const response = await fetch('/empty_db.duckdb');
            if (!response.ok) {
              throw new Error(`Failed to fetch template: ${response.status}`);
            }
            
            const buffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(buffer);
            
            if (uint8Array.length === 0) {
              throw new Error('Template database is empty');
            }
            
            // console.log(`Template database loaded: ${uint8Array.length} bytes`);
            
            // Register and open template database
            await database.registerFileBuffer('data.duckdb', uint8Array);
            await database.open({
              path: 'data.duckdb',
              accessMode: duckdb.DuckDBAccessMode.READ_WRITE,
            });
            
            templateConnection = await database.connect();
            // console.log('Initialized from template database');
          } catch (err) {
            console.warn('Failed to load template database, falling back to SQL schema:', err);
          }
          
          // Fallback: create with SQL schema if template failed
          if (!templateConnection) {
            await database.open({
              path: 'data.duckdb',
              accessMode: duckdb.DuckDBAccessMode.READ_WRITE,
            });
            // console.log('New file-backed database opened');
            
            templateConnection = await database.connect();
            await initializeSchema({ run: (sql) => templateConnection!.query(sql).then(() => {}) });
            // console.log('Schema initialized (SQL fallback)');
          }
          
          connection = templateConnection;
          
          // Force checkpoint to ensure data is written
          await connection.query('CHECKPOINT');
          await database.flushFiles();
          // console.log('Changes flushed to disk');
          
          // DON'T save to OPFS immediately - it causes corruption
          // Will be saved on first user action (auto-save effect)
          // console.log('Database ready (OPFS save deferred)');
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

  // Auto-save to OPFS when there are unsaved changes (debounced)
  useEffect(() => {
    if (!hasUnsavedChanges || !db || !conn) return;

    const timeoutId = setTimeout(async () => {
      try {
        await saveToOPFS(db, conn);
        setHasUnsavedChanges(false);
        // console.log('Auto-saved to OPFS');
        // Refresh cache size
        const size = await getOPFSCacheSize();
        setCacheSize(size);
      } catch (err) {
        console.error('Auto-save to OPFS failed:', err);
      }
    }, 5000); // Save after 5 seconds of inactivity (increased from 2s)

    return () => clearTimeout(timeoutId);
  }, [hasUnsavedChanges, db, conn]);

  const importFromFile = useCallback(
    async (file: File): Promise<void> => {
      if (!db || !conn) throw new Error('Database not initialized');

      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);

      // console.log('Importing file:', file.name, 'Size:', file.size, 'bytes');

      // Flush any pending writes first
      await db.flushFiles();
      
      // Close connection
      await conn.close();
      
      // Close the database to release WAL lock
      await db.open({ path: ':memory:' });
      
      // Now drop the old files
      await db.dropFile('data.duckdb').catch(() => {});
      await db.dropFile('data.duckdb.wal').catch(() => {});
      
      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Register and open new file
      await db.registerFileBuffer('data.duckdb', uint8Array);
      
      try {
        await db.open({
          path: 'data.duckdb',
          accessMode: duckdb.DuckDBAccessMode.READ_WRITE,
        });
      } catch (err) {
        console.error('Failed to open database:', err);
        // Try to recover by reinitializing
        await db.open({ path: ':memory:' });
        await db.dropFile('data.duckdb').catch(() => {});
        throw new Error('The file is not a valid DuckDB database. Please use JSON export for sharing files.');
      }

      const newConn = await db.connect();
      
      // Verify database is valid by running a simple query
      try {
        await newConn.query('SELECT 1');
        // console.log('Database connection verified');
      } catch (err) {
        console.error('Database verification failed:', err);
        await newConn.close();
        throw new Error('Database appears corrupted. Please use JSON export instead.');
      }
      
      setConn(newConn);
      setHasUnsavedChanges(false);

      // Defer OPFS save to avoid immediate corruption
      setTimeout(async () => {
        try {
          await saveToOPFS(db, newConn);
          const size = await getOPFSCacheSize();
          setCacheSize(size);
          // console.log('Deferred OPFS save after import completed');
        } catch (err) {
          console.warn('Deferred OPFS save failed:', err);
        }
      }, 1000);
      
      // console.log('Import successful');
    },
    [db, conn]
  );

  const exportToBlob = useCallback(async (): Promise<Blob> => {
    if (!db || !conn) throw new Error('Database not initialized');

    try {
      // console.log('Starting database export...');
      
      // Verify database has data
      try {
        const testCount = await conn.query('SELECT COUNT(*) as cnt FROM tests');
        const count = testCount.toArray()[0]?.toJSON() as { cnt: number };
        // console.log(`Database contains ${count.cnt} tests`);
        
        if (count.cnt === 0) {
          throw new Error('Cannot save: database is empty. Create at least one test first.');
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('Cannot save')) {
          throw err;
        }
        console.error('Failed to check test count:', err);
        throw new Error('Database verification failed. Try using Export → JSON instead.');
      }
      
      // Force all pending transactions to complete
      try {
        await conn.query('COMMIT');
        // console.log('Transaction committed');
      } catch (e) {
        // console.log('No active transaction to commit');
      }

      // Multiple checkpoints to ensure all data is written
      // console.log('Running checkpoints...');
      await conn.query('CHECKPOINT');
      await conn.query('CHECKPOINT');
      // console.log('Checkpoints completed');
      
      // Flush all files
      await db.flushFiles();
      // console.log('Files flushed');
      
      // CRITICAL: Save to OPFS FIRST before trying to export
      // console.log('Saving to OPFS before export...');
      try {
        await saveToOPFS(db, conn);
        // console.log('Pre-export OPFS save successful');
      } catch (err) {
        console.warn('Pre-export OPFS save failed:', err);
      }
      
      // Wait for filesystem sync
      await new Promise(resolve => setTimeout(resolve, 500));
      // console.log('Filesystem sync wait completed');
      
      // Now get the buffer from OPFS
      // console.log('Copying database from OPFS...');
      let buffer: Uint8Array;
      
      try {
        if ('storage' in navigator && 'getDirectory' in navigator.storage) {
          const root = await navigator.storage.getDirectory();
          const fileHandle = await root.getFileHandle('pm_tester.duckdb', { create: false });
          const file = await fileHandle.getFile();
          buffer = new Uint8Array(await file.arrayBuffer());
          // console.log(`Database loaded from OPFS: ${buffer.length} bytes`);
        } else {
          throw new Error('OPFS not supported');
        }
      } catch (err) {
        console.error('Failed to load from OPFS:', err);
        throw new Error(
          'Failed to export database.\n\n' +
          'The database could not be saved to browser storage.\n\n' +
          '💡 Try:\n' +
          '1. Use "Export" → JSON instead (100% reliable)\n' +
          '2. Check browser storage permissions\n' +
          '3. Clear DB and start fresh'
        );
      }
      
      // console.log(`Database buffer ready: ${buffer.length} bytes`);
      
      if (buffer.length === 0) {
        throw new Error(
          'Failed to export database: file is empty.\n\n' +
          'This can happen when:\n' +
          '• Database was just created\n' +
          '• Changes were not saved properly\n' +
          '• DuckDB encountered an internal error\n\n' +
          '💡 Try:\n' +
          '1. Refresh the page\n' +
          '2. Create a new test\n' +
          '3. Use Export → JSON instead'
        );
      }
      
      setHasUnsavedChanges(false);

      // Save to OPFS (with proper delay for consistency)
      try {
        await saveToOPFS(db, conn);
        // console.log('Saved to OPFS after export');
      } catch (err) {
        console.warn('OPFS save failed (non-critical):', err);
      }
      
      // Refresh cache size
      const size = await getOPFSCacheSize();
      setCacheSize(size);

      // Convert to ArrayBuffer for Blob compatibility
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
      
      // Validate the buffer is not empty
      if (arrayBuffer.byteLength === 0) {
        throw new Error('Exported database is empty. This may indicate a serious error.');
      }
      
      return new Blob([arrayBuffer], { type: 'application/octet-stream' });
    } catch (err) {
      console.error('Export failed:', err);
      throw err;
    }
  }, [db, conn]);

  const refreshCacheSize = useCallback(async (): Promise<void> => {
    const size = await getOPFSCacheSize();
    setCacheSize(size);
  }, []);

  const clearCache = useCallback(async (): Promise<void> => {
    if (!db || !conn) throw new Error('Database not initialized');

    try {
      // console.log('Clearing database...');
      
      // Clear all data from tables (more reliable than dropping files)
      const tablesToClear = [
        'test_current_session',
        'test_statistics',
        'media_blobs',
        'questions',
        'question_options',
        'tests',
        'difficulty_levels',
        'test_subgroups',
        'test_groups'
      ];
      
      for (const table of tablesToClear) {
        try {
          await conn.query(`DELETE FROM ${table}`);
          // console.log(`Cleared table: ${table}`);
        } catch (err) {
          console.warn(`Failed to clear ${table}:`, err);
        }
      }
      
      // Run VACUUM to reclaim space
      await conn.query('VACUUM');
      // console.log('Database vacuumed');
      
      // Force checkpoint and flush
      await conn.query('CHECKPOINT');
      await db.flushFiles();
      // console.log('Changes flushed to disk');
      
      // Clear OPFS cache
      await clearOPFSCache().catch((e) => console.warn('Clear OPFS:', e));
      // console.log('OPFS cache cleared');
      
      // Save new empty database to OPFS
      await saveToOPFS(db, conn).catch((e) => console.warn('Save to OPFS:', e));
      // console.log('New empty database saved to OPFS');
      
      // Update state
      setHasUnsavedChanges(false);
      
      // Refresh cache size
      const size = await getOPFSCacheSize();
      setCacheSize(size);
      
      // console.log('Database cleared and reinitialized successfully');
    } catch (err) {
      console.error('Failed to clear database:', err);
      throw err;
    }
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
    // console.log('Loaded database from OPFS, size:', buffer.byteLength, 'bytes');
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

  if (!conn) {
    console.warn('No connection available for OPFS save');
    return;
  }

  try {
    // console.log('Saving file-backed database to OPFS...');
    
    // Checkpoint and flush to ensure all data is written to data.duckdb
    await conn.query('CHECKPOINT');
    await db.flushFiles();
    
    // Wait for filesystem sync
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Copy the data.duckdb file buffer directly
    const buffer = await db.copyFileToBuffer('data.duckdb');
    
    if (!buffer || buffer.length === 0) {
      console.warn('Buffer is empty, skipping OPFS save');
      return;
    }

    // Save to OPFS
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle('pm_tester.duckdb', { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(new Uint8Array(buffer).buffer.slice(0));
    await writable.close();
    // console.log(`Saved to OPFS (${buffer.length} bytes)`);
  } catch (err) {
    console.error('Failed to save to OPFS:', err);
    // Don't throw - OPFS save is optional
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
    // console.log('Cleared OPFS cache');
  } catch (err) {
    console.warn('Failed to clear OPFS cache:', err);
  }
}
