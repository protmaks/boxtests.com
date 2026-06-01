import LandingPageLayout from './LandingPageLayout';
import { SEO_CONFIGS } from '../../utils/seo';

const features = [
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: 'Active Recall',
    description: 'Test yourself instead of passively re-reading. Research shows active recall improves retention by up to 50% compared to passive study methods.',
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Instant Feedback',
    description: 'Know immediately what you got right and wrong. No waiting for grades — see your results in real-time and adjust your study strategy.',
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Track Progress',
    description: 'See your improvement over time with built-in analytics. Identify weak areas and focus your study time where it matters most.',
  },
];

const faqs = [
  {
    question: 'What is self-study quizzing and why does it work?',
    answer: 'Self-study quizzing, also known as retrieval practice, is a learning technique where you test yourself on material rather than just re-reading it. Research in cognitive psychology shows that the act of retrieving information strengthens memory more than passive review. This is called the "testing effect" — and BOX-tests makes it easy to apply this technique to any subject.',
  },
  {
    question: 'How do I create my first quiz?',
    answer: 'Click "Create Your First Test" above, give your test a name, and start adding questions. You can add multiple-choice questions with 2-6 answer options, mark correct answers, and add explanations. Your quiz is saved automatically to your device — no account needed.',
  },
  {
    question: 'Can I organize quizzes by subject or topic?',
    answer: 'Yes! BOX-tests supports groups and categories. Create groups for different subjects (Math, History, Programming) and assign tests to them. You can also set difficulty levels to create a progressive learning path from beginner to advanced.',
  },
  {
    question: 'Is there a limit to how many quizzes I can create?',
    answer: 'No limits! Create as many quizzes as you need. All data is stored locally on your device using DuckDB, a high-performance database. There are no quotas, no premium tiers, and no artificial restrictions.',
  },
  {
    question: 'Can I share my quizzes with others?',
    answer: 'Yes, you can export your quizzes to JSON or TXT format and share them with friends, classmates, or students. They can import the file into their own BOX-tests and start practicing immediately.',
  },
];

export default function SelfStudyQuizMakerPage() {
  return (
    <LandingPageLayout
      seoConfig={SEO_CONFIGS.selfStudyQuizMaker}
      badge="Science-Backed Learning"
      headline={
        <>
          <span className="text-gradient">Self-Study</span>{' '}
          <span className="text-slate-200">Quiz Maker</span>
        </>
      }
      tagline="Master any subject with active recall"
      description="Create personalized quizzes to test yourself on any topic. The testing effect is one of the most powerful learning techniques — and now it's at your fingertips, completely free and private."
      features={features}
      faqs={faqs}
      showWorkflowDemo={false}
    >
      {/* Additional content section with study tips */}
      <div className="relative z-10 w-full max-w-4xl mx-auto mb-16 animate-slide-in" style={{ animationDelay: '0.55s' }}>
        <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900/50 to-slate-800/30 border border-slate-700/30">
          <h2 className="text-2xl font-bold text-slate-200 mb-6 text-center">
            The Science of Self-Testing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">1</div>
              <div>
                <h3 className="font-semibold text-slate-200 mb-1">The Testing Effect</h3>
                <p className="text-sm text-slate-400">Retrieving information from memory strengthens neural pathways more than passive review.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">2</div>
              <div>
                <h3 className="font-semibold text-slate-200 mb-1">Spaced Practice</h3>
                <p className="text-sm text-slate-400">Spreading study sessions over time improves long-term retention vs. cramming.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">3</div>
              <div>
                <h3 className="font-semibold text-slate-200 mb-1">Desirable Difficulty</h3>
                <p className="text-sm text-slate-400">Challenging yourself (within reason) leads to better learning outcomes.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">4</div>
              <div>
                <h3 className="font-semibold text-slate-200 mb-1">Immediate Feedback</h3>
                <p className="text-sm text-slate-400">Knowing whether you're right or wrong helps correct misconceptions quickly.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LandingPageLayout>
  );
}
