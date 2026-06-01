import LandingPageLayout from './LandingPageLayout';
import { SEO_CONFIGS } from '../../utils/seo';

const features = [
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Zero Data Collection',
    description: 'We don\'t collect any data. No analytics, no tracking pixels, no cookies. Your study habits are yours alone.',
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    title: 'No Account Required',
    description: 'Start using immediately. No email, no password, no personal information requested. Just open and start creating.',
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Local-Only Storage',
    description: 'All data stays in your browser\'s storage. Nothing is ever sent to any server. Your device is the only place your data exists.',
  },
];

const faqs = [
  {
    question: 'Is my study data really private?',
    answer: 'Yes, 100%. BOX-tests stores everything in your browser using IndexedDB and DuckDB WASM. There is no server backend that receives your data. We can\'t see your tests, your scores, or anything you create — because the data never leaves your device.',
  },
  {
    question: 'How is this different from Quizlet or Anki?',
    answer: 'Quizlet requires an account and stores your data on their servers. Anki can be local but requires software installation. BOX-tests runs entirely in your browser with no account, no installation, and complete privacy. You get the convenience of a web app with the privacy of a desktop application.',
  },
  {
    question: 'Do you use any tracking or analytics?',
    answer: 'No. We don\'t use Google Analytics, Facebook Pixel, or any other tracking service. We don\'t know who visits, what they create, or how they use the app. Your privacy isn\'t just a policy — it\'s architecturally enforced.',
  },
  {
    question: 'What about GDPR compliance?',
    answer: 'Since we don\'t collect any personal data, GDPR compliance is straightforward — there\'s nothing to protect because we never have your data in the first place. This is privacy by design at its core.',
  },
  {
    question: 'Can I use this for sensitive study materials?',
    answer: 'Yes. Since data never leaves your device, you can create flashcards for confidential materials, professional certifications, medical studies, or anything else you want to keep private. Just remember to back up your data regularly.',
  },
];

export default function PrivacyFlashcardsPage() {
  return (
    <LandingPageLayout
      seoConfig={SEO_CONFIGS.privacyFlashcards}
      badge="100% Private"
      headline={
        <>
          <span className="text-gradient">Privacy-First</span>{' '}
          <span className="text-slate-200">Flashcards</span>
        </>
      }
      tagline="Study without surveillance"
      description="Your learning data is sensitive. BOX-tests keeps it private by design — no accounts, no cloud, no tracking. Everything stays on your device, under your control."
      features={features}
      faqs={faqs}
      showWorkflowDemo={false}
    >
      {/* Comparison table */}
      <div className="relative z-10 w-full max-w-4xl mx-auto mb-16 animate-slide-in" style={{ animationDelay: '0.55s' }}>
        <h2 className="text-2xl font-bold text-center text-slate-200 mb-8">
          Privacy Comparison
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="p-4 text-left text-slate-400 font-medium">Feature</th>
                <th className="p-4 text-center text-cyan-400 font-medium">BOX-tests</th>
                <th className="p-4 text-center text-slate-500 font-medium">Quizlet</th>
                <th className="p-4 text-center text-slate-500 font-medium">Anki Web</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-700/30">
                <td className="p-4 text-slate-300">Account Required</td>
                <td className="p-4 text-center">
                  <span className="text-green-400">✗ No</span>
                </td>
                <td className="p-4 text-center">
                  <span className="text-red-400">✓ Yes</span>
                </td>
                <td className="p-4 text-center">
                  <span className="text-red-400">✓ Yes</span>
                </td>
              </tr>
              <tr className="border-b border-slate-700/30">
                <td className="p-4 text-slate-300">Data Stored Locally</td>
                <td className="p-4 text-center">
                  <span className="text-green-400">✓ 100%</span>
                </td>
                <td className="p-4 text-center">
                  <span className="text-red-400">✗ Cloud</span>
                </td>
                <td className="p-4 text-center">
                  <span className="text-yellow-400">~ Synced</span>
                </td>
              </tr>
              <tr className="border-b border-slate-700/30">
                <td className="p-4 text-slate-300">Tracking/Analytics</td>
                <td className="p-4 text-center">
                  <span className="text-green-400">✗ None</span>
                </td>
                <td className="p-4 text-center">
                  <span className="text-red-400">✓ Yes</span>
                </td>
                <td className="p-4 text-center">
                  <span className="text-red-400">✓ Yes</span>
                </td>
              </tr>
              <tr className="border-b border-slate-700/30">
                <td className="p-4 text-slate-300">Works Offline</td>
                <td className="p-4 text-center">
                  <span className="text-green-400">✓ Yes</span>
                </td>
                <td className="p-4 text-center">
                  <span className="text-red-400">✗ No</span>
                </td>
                <td className="p-4 text-center">
                  <span className="text-red-400">✗ No</span>
                </td>
              </tr>
              <tr>
                <td className="p-4 text-slate-300">Free Forever</td>
                <td className="p-4 text-center">
                  <span className="text-green-400">✓ Yes</span>
                </td>
                <td className="p-4 text-center">
                  <span className="text-yellow-400">~ Freemium</span>
                </td>
                <td className="p-4 text-center">
                  <span className="text-green-400">✓ Yes</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Privacy principles */}
      <div className="relative z-10 w-full max-w-4xl mx-auto mb-16 animate-slide-in" style={{ animationDelay: '0.58s' }}>
        <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900/50 to-slate-800/30 border border-slate-700/30">
          <h2 className="text-2xl font-bold text-slate-200 mb-6 text-center">
            Our Privacy Principles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 mb-1">Privacy by Design</h3>
                <p className="text-sm text-slate-400">Privacy isn't an afterthought — it's the foundation of our architecture.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 mb-1">Data Minimization</h3>
                <p className="text-sm text-slate-400">We collect zero data because we don't need any data to function.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 mb-1">User Ownership</h3>
                <p className="text-sm text-slate-400">You own your data completely. Export, delete, or keep it — your choice.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 mb-1">Transparency</h3>
                <p className="text-sm text-slate-400">Open about what we do (nothing) with your data. No hidden practices.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LandingPageLayout>
  );
}
