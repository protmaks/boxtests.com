import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';

export default function NotFoundPage() {
  useSEO({
    title: '404 - Page Not Found | BOX-tests',
    description: 'The page you are looking for does not exist.',
    keywords: '',
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-12">
      {/* Geometric decoration */}
      <div className="absolute top-20 left-1/4 w-64 h-64 bg-red-500/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <div className="relative z-10 text-center max-w-4xl">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-red-500/10 border border-red-500/20 rounded-full backdrop-blur-sm animate-slide-in">
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-mono text-red-400 tracking-wider uppercase">
            Error 404
          </span>
        </div>

        {/* 404 Number with geometric style */}
        <div className="mb-6 animate-slide-in" style={{ animationDelay: '0.1s' }}>
          <h1 className="text-9xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-red-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
              404
            </span>
          </h1>
        </div>

        {/* Heading */}
        <h2 className="text-4xl font-bold mb-4 text-slate-200 animate-slide-in" style={{ animationDelay: '0.2s' }}>
          Page Not Found
        </h2>
        
        {/* Description */}
        <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed animate-slide-in" style={{ animationDelay: '0.3s' }}>
          The page you're looking for doesn't exist or has been moved. 
          Let's get you back on track with geometric precision.
        </p>

        {/* CTA Button */}
        <div className="flex gap-4 justify-center items-center animate-slide-in" style={{ animationDelay: '0.4s' }}>
          <Link
            to="/"
            className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(14,165,233,0.5)]"
          >
            <span className="relative z-10 flex items-center gap-2">
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
          
          <Link
            to="/tests"
            className="group relative px-8 py-4 bg-slate-800/50 backdrop-blur-sm border-2 border-cyan-500/30 text-cyan-400 font-semibold rounded-lg overflow-hidden transition-all duration-300 hover:border-cyan-500/60 hover:bg-slate-800/80 hover:scale-105"
          >
            <span className="relative z-10 flex items-center gap-2">
              View Tests
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </Link>
        </div>

        {/* Decorative elements */}
        <div className="mt-20 flex justify-center gap-4 animate-slide-in" style={{ animationDelay: '0.5s' }}>
          <div className="w-16 h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent rounded-full"></div>
          <div className="w-16 h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent rounded-full" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-16 h-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent rounded-full" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}
