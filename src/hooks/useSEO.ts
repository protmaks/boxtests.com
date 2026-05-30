import { useEffect } from 'react';
import { updateSEO, type SEOConfig } from '../utils/seo';

/**
 * React hook for updating page SEO
 * @param config - SEO configuration
 * @param deps - Optional dependencies array for re-running effect
 * 
 * @example
 * ```tsx
 * function MyPage() {
 *   useSEO({
 *     title: 'My Page Title',
 *     description: 'Page description',
 *     url: '/my-page'
 *   });
 *   
 *   return <div>Content</div>;
 * }
 * ```
 */
export function useSEO(config: SEOConfig, deps: unknown[] = []): void {
  useEffect(() => {
    updateSEO(config);
  }, [config, ...deps]);
}
