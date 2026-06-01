/**
 * SEO Utility for dynamically updating meta tags
 * Use this to update page metadata when navigating in SPA
 */

export interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  canonical?: string;
}

/**
 * Update page meta tags dynamically
 * @param config - SEO configuration object
 */
export function updateSEO(config: SEOConfig): void {
  const baseUrl = 'https://boxtests.com';
  
  // Update title
  if (config.title) {
    document.title = config.title;
    updateMetaTag('property', 'og:title', config.title);
    updateMetaTag('name', 'twitter:title', config.title);
  }
  
  // Update description
  if (config.description) {
    updateMetaTag('name', 'description', config.description);
    updateMetaTag('property', 'og:description', config.description);
    updateMetaTag('name', 'twitter:description', config.description);
  }
  
  // Update keywords
  if (config.keywords) {
    updateMetaTag('name', 'keywords', config.keywords);
  }
  
  // Update image
  if (config.image) {
    const fullImageUrl = config.image.startsWith('http') 
      ? config.image 
      : `${baseUrl}${config.image}`;
    updateMetaTag('property', 'og:image', fullImageUrl);
    updateMetaTag('name', 'twitter:image', fullImageUrl);
  }
  
  // Update URL
  if (config.url) {
    const fullUrl = config.url.startsWith('http') 
      ? config.url 
      : `${baseUrl}${config.url}`;
    updateMetaTag('property', 'og:url', fullUrl);
    updateMetaTag('name', 'twitter:url', fullUrl);
    
    // Update canonical
    updateLinkTag('canonical', fullUrl);
  }
  
  // Update canonical separately if provided
  if (config.canonical) {
    const fullCanonical = config.canonical.startsWith('http')
      ? config.canonical
      : `${baseUrl}${config.canonical}`;
    updateLinkTag('canonical', fullCanonical);
  }
  
  // Update type
  if (config.type) {
    updateMetaTag('property', 'og:type', config.type);
  }
}

/**
 * Helper to update or create a meta tag
 */
function updateMetaTag(
  attribute: 'name' | 'property',
  value: string,
  content: string
): void {
  let element = document.querySelector(`meta[${attribute}="${value}"]`);
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, value);
    document.head.appendChild(element);
  }
  
  element.setAttribute('content', content);
}

/**
 * Helper to update or create a link tag
 */
function updateLinkTag(rel: string, href: string): void {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
  
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  
  element.setAttribute('href', href);
}

/**
 * Pre-defined SEO configs for common pages
 */
export const SEO_CONFIGS = {
  home: {
    title: 'BOX-tests - Self-Testing Made Simple | Privacy-First Quiz Platform',
    description: 'Create tests, take them, and track your progress — all stored locally on your device. No accounts, no cloud, instant results. Privacy-first self-testing platform.',
    keywords: 'self-testing, quiz app, local-first, privacy-first, offline testing, test creation, study platform, flashcards, knowledge assessment, no account required',
    url: '/',
    type: 'website',
  },
  tests: {
    title: 'My Tests - BOX-tests',
    description: 'Browse and manage your tests. Create new tests, edit existing ones, and track your progress with instant local analytics.',
    keywords: 'my tests, test list, manage tests, online testing',
    url: '/tests',
    type: 'website',
  },
  create: {
    title: 'Create New Test - BOX-tests',
    description: 'Create a new test with custom questions, difficulty levels, and categories. Build your knowledge assessment tools with our intuitive test creator.',
    keywords: 'create test, new test, test builder, quiz creator',
    url: '/create',
    type: 'website',
  },
  manageGroups: {
    title: 'Manage Groups - BOX-tests',
    description: 'Organize your tests into groups and categories. Create and manage test groups for better organization.',
    keywords: 'test groups, organize tests, test categories',
    url: '/manage/groups',
    type: 'website',
  },
  manageDifficulty: {
    title: 'Manage Difficulty Levels - BOX-tests',
    description: 'Configure and customize difficulty levels for your tests. Set up appropriate challenge levels for your assessments.',
    keywords: 'difficulty levels, test difficulty, test settings',
    url: '/manage/difficulty',
    type: 'website',
  },
  
  // Landing Pages for SEO
  selfStudyQuizMaker: {
    title: 'Self-Study Quiz Maker — Create Personal Study Quizzes | BOX-tests',
    description: 'Create custom study quizzes for self-testing. Active recall and spaced repetition made easy. No account needed, works offline, 100% private.',
    keywords: 'self-study quiz maker, create study quiz, personal quiz tool, self-assessment tool, active recall app, study quiz generator, flashcard quiz maker',
    url: '/self-study-quiz-maker',
    type: 'website',
  },
  offlineTestCreator: {
    title: 'Offline Test Creator — Quiz App That Works Without Internet | BOX-tests',
    description: 'Create and take tests offline. No internet required — powered by DuckDB WASM. Perfect for travel, exams, or areas with poor connectivity.',
    keywords: 'offline test creator, offline quiz app, test maker without internet, no-internet quiz tool, works offline quiz, local quiz app',
    url: '/offline-test-creator',
    type: 'website',
  },
  privacyFlashcards: {
    title: 'Privacy-First Flashcards — Study App Without Tracking | BOX-tests',
    description: 'Study with complete privacy. No accounts, no cloud, no tracking. Your data stays on your device. The secure alternative to Quizlet and Anki.',
    keywords: 'privacy-first flashcards, private flashcard app, secure study tool, no-account quiz app, anonymous learning app, flashcards without login',
    url: '/privacy-flashcards',
    type: 'website',
  },
  help: {
    title: 'Help & Documentation - BOX-tests',
    description: 'Learn how to use BOX-tests. Get help with creating tests, managing questions, and understanding local-first features.',
    keywords: 'help, documentation, how to use, user guide, tutorial, BOX-tests help',
    url: '/help',
    type: 'website',
  },
} as const;
