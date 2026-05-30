import { Outlet, Link } from 'react-router-dom';
import { DuckDBProvider } from './context/DuckDBContext';
import { FileActions } from './components/FileActions';
import { DBStatus } from './components/DBStatus';
import { useBeforeUnload } from './hooks/useBeforeUnload';
import { AnimatedBackground } from './components/AnimatedBackground';
import { useState } from 'react';

function AppContent() {
  useBeforeUnload();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Animated geometric background */}
      <AnimatedBackground />
      
      {/* Backdrop blur layer */}
      <div className="fixed inset-0 backdrop-blur-[1px] pointer-events-none z-0"></div>
      
      <header className="relative z-10 bg-slate-900/80 backdrop-blur-xl border-b border-cyan-500/20 shadow-[0_0_30px_rgba(14,165,233,0.15)]">
        <nav className="max-w-6xl mx-auto px-4 py-3 sm:py-5 flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center gap-2 sm:gap-3 group transition-transform hover:scale-105"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="relative">
              <img 
                src="/logo.svg" 
                alt="BOX-tests logo" 
                className="h-8 sm:h-10 w-auto group-hover:drop-shadow-[0_0_12px_rgba(14,165,233,0.6)] transition-all duration-300" 
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-2xl font-bold tracking-tight text-gradient">
                BOX-tests
              </span>
              <span className="text-[8px] sm:text-[10px] font-mono text-cyan-400/60 tracking-widest uppercase">
                Precision Testing
              </span>
            </div>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex gap-1 items-center">
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-cyan-400 transition-colors"
            aria-label="Toggle menu"
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </nav>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-cyan-500/10">
            <div className="px-4 py-3 space-y-1">
              <Link
                to="/tests"
                className="block px-4 py-3 text-sm font-medium text-slate-300 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tests
              </Link>
              <Link
                to="/manage/groups"
                className="block px-4 py-3 text-sm font-medium text-slate-300 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Groups
              </Link>
              <Link
                to="/manage/difficulty"
                className="block px-4 py-3 text-sm font-medium text-slate-300 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Difficulty
              </Link>
              <div className="pt-3 border-t border-cyan-500/20">
                <FileActions>
                  <DBStatus />
                </FileActions>
              </div>
            </div>
          </div>
        )}
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
