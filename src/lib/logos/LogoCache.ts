/**
 * Logo Cache Manager
 */

export class LogoCache {
  private static cache = new Map<string, string>();

  /**
   * Set a cached domain to logo URL mapping
   */
  static set(domain: string, url: string): void {
    const cleanDomain = domain.toLowerCase().trim();
    this.cache.set(cleanDomain, url);
  }

  /**
   * Get cached logo URL for a domain
   */
  static get(domain: string): string | undefined {
    const cleanDomain = domain.toLowerCase().trim();
    return this.cache.get(cleanDomain);
  }

  /**
   * Check if a domain has a cached logo URL
   */
  static has(domain: string): boolean {
    const cleanDomain = domain.toLowerCase().trim();
    return this.cache.has(cleanDomain);
  }

  /**
   * Clear all cached items
   */
  static clear(): void {
    this.cache.clear();
  }
}
