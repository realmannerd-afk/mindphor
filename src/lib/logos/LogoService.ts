/**
 * Logo Service for coordinating Logo.dev requests
 */
import { LogoCache } from './LogoCache';

// Regular expression to check basic domain format validity
const DOMAIN_REGEX = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;

export class LogoService {
  private static token: string | undefined = 
    (import.meta.env?.PUBLIC_LOGO_DEV_TOKEN as string) || 
    (import.meta.env?.LOGO_DEV_TOKEN as string) || 
    undefined;

  /**
   * Set custom Logo.dev token at runtime
   */
  static setToken(token: string): void {
    this.token = token;
  }

  /**
   * Validate if a string format is a correct domain
   */
  static isValidDomain(domain: string): boolean {
    if (!domain) return false;
    const clean = domain.trim().toLowerCase();
    return DOMAIN_REGEX.test(clean);
  }

  /**
   * Construct an array of logo URLs to try sequentially for fallbacks.
   */
  static getLogoUrls(domain: string, size: number = 128): string[] {
    const cleanDomain = domain.trim().toLowerCase();
    
    // Map domains to standard names
    let logoName = '';
    if (cleanDomain.includes('reddit.com') || cleanDomain === 'reddit') logoName = 'reddit';
    else if (cleanDomain === 'app_store' || cleanDomain === 'appstore' || cleanDomain === 'app store' || cleanDomain.includes('apps.apple.com')) logoName = 'app-store';
    else if (cleanDomain.includes('apple.com') || cleanDomain === 'apple' || cleanDomain.includes('applemusic.com')) logoName = 'apple';
    else if (cleanDomain.includes('play.google.com') || cleanDomain === 'play_store' || cleanDomain === 'google_play' || cleanDomain === 'playstore' || cleanDomain === 'google play') logoName = 'google-play';
    else if (cleanDomain.includes('twitter.com') || cleanDomain === 'twitter' || cleanDomain === 'x') logoName = 'x';
    else if (cleanDomain.includes('slack.com') || cleanDomain === 'slack') logoName = 'slack';
    else if (cleanDomain.includes('discord.com') || cleanDomain === 'discord') logoName = 'discord';
    else if (cleanDomain.includes('github.com') || cleanDomain === 'github') logoName = 'github';
    else if (cleanDomain.includes('notion.so') || cleanDomain === 'notion') logoName = 'notion';
    else if (cleanDomain.includes('linear.app') || cleanDomain === 'linear') logoName = 'linear';
    else if (cleanDomain.includes('atlassian.com') || cleanDomain === 'jira') logoName = 'jira';
    else if (cleanDomain.includes('productboard.com') || cleanDomain === 'productboard') logoName = 'productboard';
    else if (cleanDomain.includes('google.com') || cleanDomain === 'google') logoName = 'google';
    else if (cleanDomain.includes('openai.com') || cleanDomain === 'openai' || cleanDomain === 'gpt-4o' || cleanDomain === 'gpt-4') logoName = 'openai';
    else if (cleanDomain.includes('claude.ai') || cleanDomain === 'claude' || cleanDomain.includes('anthropic.com')) logoName = 'claude';
    else if (cleanDomain.includes('gemini') || cleanDomain === 'google gemini') logoName = 'gemini';
    else if (cleanDomain.includes('mistral')) logoName = 'mistral';
    else if (cleanDomain.includes('perplexity')) logoName = 'perplexity';
    else if (cleanDomain.includes('deepseek')) logoName = 'deepseek';
    else if (cleanDomain.includes('cohere')) logoName = 'cohere';
    else if (cleanDomain.includes('meta') || cleanDomain.includes('llama')) logoName = 'meta';
    else if (cleanDomain.includes('whatsapp.com') || cleanDomain === 'whatsapp') logoName = 'whatsapp';
    else {
      // Fallback: extract the name from the domain
      const parts = cleanDomain.split('.');
      if (parts.length >= 2) {
        logoName = parts[parts.length - 2];
      } else {
        logoName = cleanDomain;
      }
    }

    if (logoName === 'google-play') {
      return [
        'https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg',
        `https://www.google.com/s2/favicons?domain=play.google.com&sz=${size}`
      ];
    }
    
    if (logoName === 'app-store') {
      return [
        '/local_logos/appstore.svg',
        `https://www.google.com/s2/favicons?domain=apple.com&sz=${size}`
      ];
    }
    
    const urls: string[] = [];

    // Known high-quality brands to fetch SVGs for first
    const KNOWN_BRANDS = new Set([
      'reddit', 'apple', 'x', 'slack', 'discord', 'github', 
      'notion', 'linear', 'jira', 'productboard', 'google', 
      'openai', 'claude', 'whatsapp', 'spotify', 'soundcloud'
    ]);

    const isKnownBrand = KNOWN_BRANDS.has(logoName);

    // 1. LobeHub Icons for AI models and tech brands
    const LOBE_BRANDS = new Set([
      'openai', 'claude', 'gemini', 'deepseek', 'google', 'aws', 'bedrock', 
      'microsoft', 'lobehub', 'github', 'anthropic', 'meta', 'mistral', 
      'perplexity', 'cohere', 'zhipu', 'bytedance', 'alibabacloud'
    ]);

    if (LOBE_BRANDS.has(logoName)) {
      urls.push(`https://unpkg.com/@lobehub/icons-static-svg@latest/icons/${logoName}-color.svg`);
    }

    // 2. High-quality SVG repository first for known brands
    if (isKnownBrand) {
      urls.push(`https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/${logoName}.svg`);
      urls.push(`https://iconsclub.vercel.app/icons/${logoName}.svg`);
      urls.push(`https://iconsclub.vercel.app/icons/${logoName}.png`);
    }

    // 2. Fallback to custom domain resolve APIs (Logo.dev / Google Favicon)
    let fallbackDomain = cleanDomain;
    if (logoName === 'apple') fallbackDomain = 'apple.com';
    if (logoName === 'google-play') fallbackDomain = 'play.google.com';
    if (logoName === 'reddit') fallbackDomain = 'reddit.com';

    if (fallbackDomain.includes('.')) {
      if (this.token) {
        urls.push(`https://img.logo.dev/${fallbackDomain}?token=${this.token}&size=${size}`);
      } else {
        urls.push(`https://www.google.com/s2/favicons?domain=${fallbackDomain}&sz=${size}`);
      }
    }

    // 3. Fallback to SVG repo if not already tried
    if (!isKnownBrand) {
      urls.push(`https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/${logoName}.svg`);
      urls.push(`https://iconsclub.vercel.app/icons/${logoName}.svg`);
      urls.push(`https://iconsclub.vercel.app/icons/${logoName}.png`);
    }

    return urls;
  }
}
