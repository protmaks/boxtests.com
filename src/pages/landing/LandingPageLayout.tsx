import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useSEO } from '../../hooks/useSEO';
import type { SEOConfig } from '../../utils/seo';
import { WorkflowDemo } from '../../components/WorkflowDemo';

interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface LandingPageLayoutProps {
  seoConfig: SEOConfig;
  badge: string;
  headline: ReactNode;
  tagline: string;
  description: string;
  features: Feature[];
  faqs: FAQ[];
  showWorkflowDemo?: boolean;
  children?: ReactNode;
}

export default function LandingPageLayout({
  seoConfig,
  badge,
  headline,
  tagline,
  description,
  features,
  faqs,
  showWorkflowDemo = true,
  children,
}: LandingPageLayoutProps) {
  useSEO(seoConfig);

  // Generate FAQ Schema JSON-LD
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="flex flex-col items-center px-4 py-12">
      {/* FAQ Schema for Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Geometric decoration */}
      <div className="absolute top-20 left-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      {/* Hero Section */}
      <div className="relative z-10 text-center max-w-4xl mb-12">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-cyan-500/10 border border-cyan-500/20 rounded-full backdrop-blur-sm animate-slide-in">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-mono text-cyan-400 tracking-wider uppercase">
            {badge}
          </span>
        </div>

        {/* Main heading */}
        <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight animate-slide-in" style={{ animationDelay: '0.1s' }}>
          {headline}
        </h1>

        {/* Tagline */}
        <div className="mb-4 animate-slide-in" style={{ animationDelay: '0.2s' }}>
          <p className="text-xl font-mono text-cyan-400/90 tracking-wide">
            {tagline}
          </p>
        </div>

        {/* Description */}
        <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed animate-slide-in" style={{ animationDelay: '0.3s' }}>
          {description}
        </p>

        {/* CTA Buttons */}
        <div className="flex gap-4 justify-center items-center flex-wrap animate-slide-in" style={{ animationDelay: '0.4s' }}>
          <Link
            to="/create"
            className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(14,165,233,0.5)]"
          >
            <span className="relative z-10 flex items-center gap-2">
              Create Your First Test
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>

          <Link
            to="/tests"
            className="group relative px-8 py-4 bg-slate-800/50 backdrop-blur-sm border-2 border-cyan-500/30 text-cyan-400 font-semibold rounded-lg overflow-hidden transition-all duration-300 hover:border-cyan-500/60 hover:bg-slate-800/80 hover:scale-105"
          >
            <span className="relative z-10 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              View My Tests
            </span>
          </Link>
        </div>
      </div>

      {/* Workflow Demo Section */}
      {showWorkflowDemo && (
        <div className="relative z-10 w-full animate-slide-in mb-16" style={{ animationDelay: '0.5s' }}>
          <WorkflowDemo />
        </div>
      )}

      {/* Custom content slot */}
      {children}

      {/* Features Section */}
      <div className="relative z-10 w-full max-w-5xl mx-auto mb-16 animate-slide-in" style={{ animationDelay: '0.6s' }}>
        <h2 className="text-3xl font-bold text-center mb-12 text-slate-200">
          Why Choose <span className="text-gradient">BOX-tests</span>?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-xl bg-slate-900/30 border border-slate-700/30 hover:border-cyan-500/30 transition-all duration-300"
            >
              <div className="text-cyan-400 mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-slate-200 mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="relative z-10 w-full max-w-3xl mx-auto mb-16 animate-slide-in" style={{ animationDelay: '0.7s' }}>
        <h2 className="text-3xl font-bold text-center mb-12 text-slate-200">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <details
              key={index}
              className="group p-6 rounded-xl bg-slate-900/30 border border-slate-700/30 hover:border-cyan-500/30 transition-all duration-300"
            >
              <summary className="text-lg font-semibold text-slate-200 cursor-pointer list-none flex items-center justify-between">
                {faq.question}
                <svg
                  className="w-5 h-5 text-cyan-400 transform group-open:rotate-180 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-slate-400 leading-relaxed">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="relative z-10 text-center animate-slide-in" style={{ animationDelay: '0.8s' }}>
        <p className="text-slate-400 mb-6">Ready to start learning more effectively?</p>
        <Link
          to="/create"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(14,165,233,0.5)]"
        >
          Get Started — It's Free
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
        <p className="text-xs text-slate-500 mt-4">No account required. No data collected. Just start creating.</p>
      </div>

      {/* Internal Links for SEO */}
      <div className="relative z-10 w-full max-w-3xl mx-auto mt-16 pt-8 border-t border-slate-700/30">
        <p className="text-center text-sm text-slate-500 mb-4">Explore more use cases:</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/self-study-quiz-maker" className="text-sm text-cyan-400/70 hover:text-cyan-400 transition-colors">
            Self-Study Quiz Maker
          </Link>
          <span className="text-slate-600">•</span>
          <Link to="/offline-test-creator" className="text-sm text-cyan-400/70 hover:text-cyan-400 transition-colors">
            Offline Test Creator
          </Link>
          <span className="text-slate-600">•</span>
          <Link to="/privacy-flashcards" className="text-sm text-cyan-400/70 hover:text-cyan-400 transition-colors">
            Privacy-First Flashcards
          </Link>
        </div>
      </div>
    </div>
  );
}
