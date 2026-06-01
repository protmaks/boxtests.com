import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { SEO_CONFIGS } from '../utils/seo';
import { WorkflowDemo } from '../components/WorkflowDemo';

export default function HomePage() {
  useSEO(SEO_CONFIGS.home);

  return (
    <div className="flex flex-col items-center px-4 py-12">
      {/* Geometric decoration */}
      <div className="absolute top-20 left-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      {/* Hero Section */}
      <div className="relative z-10 text-center max-w-4xl mb-8">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-cyan-500/10 border border-cyan-500/20 rounded-full backdrop-blur-sm animate-slide-in">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-mono text-cyan-400 tracking-wider uppercase">
            Powered by DuckDB WASM
          </span>
        </div>

        {/* Main heading with staggered animation */}
        <h1 className="text-7xl font-bold mb-6 tracking-tight animate-slide-in" style={{ animationDelay: '0.1s' }}>
          <span className="text-gradient">BOX</span>
          <span className="text-slate-200">-tests</span>
        </h1>
        
        {/* Tagline */}
        <div className="mb-4 animate-slide-in" style={{ animationDelay: '0.2s' }}>
          <p className="text-xl font-mono text-cyan-400/90 tracking-wide">
            Self-Testing Made Simple
          </p>
        </div>

        {/* Description */}
        <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed animate-slide-in" style={{ animationDelay: '0.3s' }}>
          Create tests, take them, and track your progress — all stored locally on your device. 
          No accounts, no cloud, instant results.
        </p>

        {/* CTA Buttons */}
        <div className="flex gap-4 justify-center items-center animate-slide-in" style={{ animationDelay: '0.4s' }}>
          <Link
            to="/tests"
            className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(14,165,233,0.5)]"
          >
            <span className="relative z-10 flex items-center gap-2">
              My Tests
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
          
          <Link
            to="/create"
            className="group relative px-8 py-4 bg-slate-800/50 backdrop-blur-sm border-2 border-cyan-500/30 text-cyan-400 font-semibold rounded-lg overflow-hidden transition-all duration-300 hover:border-cyan-500/60 hover:bg-slate-800/80 hover:scale-105"
          >
            <span className="relative z-10 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Test
            </span>
          </Link>
        </div>
      </div>

      {/* Workflow Demo Section */}
      <div className="relative z-10 w-full animate-slide-in" style={{ animationDelay: '0.6s' }}>
        <WorkflowDemo />
      </div>

      {/* Feature Stats */}
      <div className="relative z-10 mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto w-full animate-slide-in" style={{ animationDelay: '0.7s' }}>
        <div className="text-center group cursor-default p-6 rounded-xl bg-slate-900/30 border border-slate-700/30 hover:border-cyan-500/30 transition-all duration-300">
          <div className="text-4xl font-bold text-gradient mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="text-base font-bold text-slate-200 mb-1">100% Private</div>
          <div className="text-xs text-slate-500 font-mono">Data never leaves your device</div>
        </div>
        
        <div className="text-center group cursor-default p-6 rounded-xl bg-slate-900/30 border border-slate-700/30 hover:border-cyan-500/30 transition-all duration-300">
          <div className="text-4xl font-bold text-gradient mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="text-base font-bold text-slate-200 mb-1">Instant Results</div>
          <div className="text-xs text-slate-500 font-mono">Real-time analytics locally</div>
        </div>
        
        <div className="text-center group cursor-default p-6 rounded-xl bg-slate-900/30 border border-slate-700/30 hover:border-cyan-500/30 transition-all duration-300">
          <div className="text-4xl font-bold text-gradient mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div className="text-base font-bold text-slate-200 mb-1">No Account Required</div>
          <div className="text-xs text-slate-500 font-mono">Start testing immediately</div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="relative z-10 mt-16 max-w-4xl w-full animate-slide-in" style={{ animationDelay: '0.8s' }}>
        <h2 className="text-2xl font-bold text-center text-slate-200 mb-8">
          Perfect For
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/self-study-quiz-maker"
            className="group p-6 rounded-xl bg-slate-900/30 border border-slate-700/30 hover:border-cyan-500/30 hover:bg-slate-800/30 transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">Self-Study</h3>
            </div>
            <p className="text-sm text-slate-400">Create quizzes for active recall and self-assessment</p>
          </Link>

          <Link
            to="/offline-test-creator"
            className="group p-6 rounded-xl bg-slate-900/30 border border-slate-700/30 hover:border-cyan-500/30 hover:bg-slate-800/30 transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">Offline Use</h3>
            </div>
            <p className="text-sm text-slate-400">Study anywhere without internet connection</p>
          </Link>

          <Link
            to="/privacy-flashcards"
            className="group p-6 rounded-xl bg-slate-900/30 border border-slate-700/30 hover:border-cyan-500/30 hover:bg-slate-800/30 transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">Privacy-First</h3>
            </div>
            <p className="text-sm text-slate-400">No accounts, no tracking, data stays local</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
