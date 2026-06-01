import { Outlet, Link } from 'react-router-dom';
import { DuckDBProvider } from './context/DuckDBContext';
import { NotificationProvider } from './context/NotificationContext';
import { useBeforeUnload } from './hooks/useBeforeUnload';
import { AnimatedBackground } from './components/AnimatedBackground';
import { BottomToolbar } from './components/BottomToolbar';
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
            <Link
              to="/help"
              className="relative px-4 py-2 text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors duration-200 group"
            >
              <span className="relative z-10">Help</span>
              <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/10 rounded-lg transition-all duration-200"></div>
            </Link>
            
            <div className="w-px h-6 bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent mx-2" />
            
            <a
              href="https://www.linkedin.com/in/protmaks/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 sm:px-3 py-2 text-slate-400 hover:text-blue-400 transition-colors flex items-center"
              title="LinkedIn Profile"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
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
              <Link
                to="/help"
                className="block px-4 py-3 text-sm font-medium text-slate-300 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Help
              </Link>
              <div className="pt-3 border-t border-cyan-500/20">
                <a
                  href="https://www.linkedin.com/in/protmaks/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-3 text-sm font-medium text-slate-300 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn Profile
                </a>
              </div>
            </div>
          </div>
        )}
      </header>
      
      <BottomToolbar />
      
      <main className="flex-1 max-w-6xl mx-auto w-full relative z-10 px-4">
        <Outlet />
      </main>
      
      <footer className="relative z-10 bg-slate-900/60 backdrop-blur-xl border-t border-cyan-500/20 py-6 text-center">
        <div className="text-sm font-mono">
          <span className="text-cyan-400/80">BOX-tests © 2025</span>
        </div>
        <div className="mt-2 text-xs text-slate-500 font-mono tracking-wider">
          100% Local. 100% Private.
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <DuckDBProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </DuckDBProvider>
  );
}

export default App;
