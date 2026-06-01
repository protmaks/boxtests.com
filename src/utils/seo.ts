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
} as const;
