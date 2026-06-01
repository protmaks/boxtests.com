import LandingPageLayout from './LandingPageLayout';
import { SEO_CONFIGS } from '../../utils/seo';

const features = [
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
      </svg>
    ),
    title: 'Zero Internet Required',
    description: 'Everything runs locally in your browser using DuckDB WASM. Create tests, take quizzes, and view results — all without any network connection.',
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
    title: 'Local Database',
    description: 'Your tests and results are stored in a real database (DuckDB) right in your browser. No cloud sync needed — your data stays with you.',
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    title: 'Export & Backup',
    description: 'Save your database to a file anytime. Transfer between devices, create backups, or share tests with others using JSON export.',
  },
];

const faqs = [
  {
    question: 'How does offline mode work?',
    answer: 'BOX-tests uses DuckDB WASM, a full SQL database compiled to WebAssembly that runs entirely in your browser. Once the page loads, everything — test creation, quiz taking, results tracking — happens locally without any server communication. Your browser becomes the database server.',
  },
  {
    question: 'Will my tests be saved if I close the browser?',
    answer: 'Yes! Your data persists in IndexedDB, which is built into your browser. When you return, your tests and progress are still there. For extra safety, you can export your database to a file anytime.',
  },
  {
    question: 'Can I use this on an airplane or in areas with no WiFi?',
    answer: 'Absolutely! Once you\'ve loaded BOX-tests at least once while online, you can use it anywhere. Perfect for flights, remote locations, subway commutes, or anywhere with unreliable connectivity.',
  },
  {
    question: 'How do I transfer my tests to another device?',
    answer: 'Use the Export feature to save your database as a .duckdb file or export specific tests as JSON. On your other device, use the Open/Import feature to load them. No account or cloud sync required.',
  },
  {
    question: 'What happens if I clear my browser data?',
    answer: 'Clearing browser data will remove your local database. That\'s why we recommend exporting your database regularly as a backup. The export file can always be imported to restore your tests.',
  },
];

export default function OfflineTestCreatorPage() {
  return (
    <LandingPageLayout
      seoConfig={SEO_CONFIGS.offlineTestCreator}
      badge="Works Without Internet"
      headline={
        <>
          <span className="text-gradient">Offline</span>{' '}
          <span className="text-slate-200">Test Creator</span>
        </>
      }
      tagline="Your quiz app that works anywhere"
      description="Create and take tests without an internet connection. Powered by DuckDB WASM, BOX-tests runs entirely in your browser. Perfect for travel, exams, or areas with unreliable connectivity."
      features={features}
      faqs={faqs}
      showWorkflowDemo={false}
    >
      {/* How it works section */}
      <div className="relative z-10 w-full max-w-4xl mx-auto mb-16 animate-slide-in" style={{ animationDelay: '0.55s' }}>
        <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900/50 to-slate-800/30 border border-slate-700/30">
          <h2 className="text-2xl font-bold text-slate-200 mb-6 text-center">
            How Offline Mode Works
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center max-w-xs">
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-200 mb-2">1. Load Once</h3>
              <p className="text-sm text-slate-400">Visit BOX-tests while online. The app loads into your browser.</p>
            </div>

            {/* Arrow */}
            <svg className="w-8 h-8 text-cyan-500/50 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center max-w-xs">
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-200 mb-2">2. Local Database</h3>
              <p className="text-sm text-slate-400">DuckDB WASM creates a real database in your browser storage.</p>
            </div>

            {/* Arrow */}
            <svg className="w-8 h-8 text-cyan-500/50 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center max-w-xs">
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-200 mb-2">3. Use Anywhere</h3>
              <p className="text-sm text-slate-400">Go offline. Everything works — create, test, review results.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Use cases */}
      <div className="relative z-10 w-full max-w-4xl mx-auto mb-16 animate-slide-in" style={{ animationDelay: '0.58s' }}>
        <h2 className="text-2xl font-bold text-center text-slate-200 mb-8">Perfect For</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { emoji: '✈️', label: 'Flights' },
            { emoji: '🚇', label: 'Subway' },
            { emoji: '🏕️', label: 'Camping' },
            { emoji: '📝', label: 'Exams' },
          ].map((item, index) => (
            <div key={index} className="p-4 rounded-xl bg-slate-900/30 border border-slate-700/30 text-center hover:border-cyan-500/30 transition-all">
              <span className="text-3xl mb-2 block">{item.emoji}</span>
              <span className="text-slate-300 font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </LandingPageLayout>
  );
}
