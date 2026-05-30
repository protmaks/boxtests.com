import { Outlet, Link } from 'react-router-dom';
import { DuckDBProvider } from './context/DuckDBContext';
import { FileActions } from './components/FileActions';
import { DBStatus } from './components/DBStatus';
import { useBeforeUnload } from './hooks/useBeforeUnload';
import { AnimatedBackground } from './components/AnimatedBackground';

function AppContent() {
  useBeforeUnload();

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Animated geometric background */}
      <AnimatedBackground />
      
      {/* Backdrop blur layer */}
      <div className="fixed inset-0 backdrop-blur-[1px] pointer-events-none z-0"></div>
      
      <header className="relative z-10 bg-slate-900/80 backdrop-blur-xl border-b border-cyan-500/20 shadow-[0_0_30px_rgba(14,165,233,0.15)]">
        <nav className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center gap-3 group transition-transform hover:scale-105"
          >
            <div className="relative">
              <img 
                src="/logo.svg" 
                alt="BOX-tests logo" 
                className="h-10 w-auto group-hover:drop-shadow-[0_0_12px_rgba(14,165,233,0.6)] transition-all duration-300" 
              />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight text-gradient">
                BOX-tests
              </span>
              <span className="text-[10px] font-mono text-cyan-400/60 tracking-widest uppercase">
                Precision Testing
              </span>
            </div>
          </Link>
          
          <div className="flex gap-1 items-center">
            <Link
              to="/tests"
              className="relative px-4 py-2 text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors duration-200 group"
            >
              <span className="relative z-10">Tests</span>
              <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/10 rounded-lg transition-all duration-200"></div>
            </Link>
            <Link
              to="/manage/groups"
              className="relative px-4 py-2 text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors duration-200 group"
            >
              <span className="relative z-10">Groups</span>
              <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/10 rounded-lg transition-all duration-200"></div>
            </Link>
            <Link
              to="/manage/difficulty"
              className="relative px-4 py-2 text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors duration-200 group"
            >
              <span className="relative z-10">Difficulty</span>
              <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/10 rounded-lg transition-all duration-200"></div>
            </Link>
            
            <div className="w-px h-6 bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent mx-2" />
            
            <FileActions>
              <DBStatus />
            </FileActions>
          </div>
        </nav>
      </header>
      
      <main className="flex-1 max-w-6xl mx-auto w-full relative z-10 px-4">
        <Outlet />
      </main>
      
      <footer className="relative z-10 bg-slate-900/60 backdrop-blur-xl border-t border-cyan-500/20 py-6 text-center">
        <div className="text-sm font-mono">
          <span className="text-slate-400">BOX-tests © 2024</span>
          <span className="mx-3 text-cyan-500/30">—</span>
          <span className="text-cyan-400/80">React + DuckDB WASM</span>
        </div>
        <div className="mt-2 text-xs text-slate-500 font-mono tracking-wider">
          GEOMETRIC PRECISION TESTING
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <DuckDBProvider>
      <AppContent />
    </DuckDBProvider>
  );
}

export default App;
