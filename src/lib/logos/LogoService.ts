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
    else if (cleanDomain.includes('apple.com') || cleanDomain === 'apple' || cleanDomain === 'app_store') logoName = 'apple';
    else if (cleanDomain.includes('play.google.com') || cleanDomain === 'play_store' || cleanDomain === 'google_play') logoName = 'google-play';
    else if (cleanDomain.includes('twitter.com') || cleanDomain === 'twitter' || cleanDomain === 'x') logoName = 'x';
    else if (cleanDomain.includes('slack.com') || cleanDomain === 'slack') logoName = 'slack';
    else if (cleanDomain.includes('discord.com') || cleanDomain === 'discord') logoName = 'discord';
    else if (cleanDomain.includes('github.com') || cleanDomain === 'github') logoName = 'github';
    else if (cleanDomain.includes('notion.so') || cleanDomain === 'notion') logoName = 'notion';
    else if (cleanDomain.includes('linear.app') || cleanDomain === 'linear') logoName = 'linear';
    else if (cleanDomain.includes('atlassian.com') || cleanDomain === 'jira') logoName = 'jira';
    else if (cleanDomain.includes('productboard.com') || cleanDomain === 'productboard') logoName = 'productboard';
    else if (cleanDomain.includes('google.com') || cleanDomain === 'google') logoName = 'google';
    else {
      // Fallback: extract the name from the domain
      const parts = cleanDomain.split('.');
      if (parts.length >= 2) {
        logoName = parts[parts.length - 2];
      } else {
        logoName = cleanDomain;
      }
    }

    const urls = [
      `https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/${logoName}.svg`,
      `https://iconsclub.vercel.app/icons/${logoName}.svg`,
      `https://iconsclub.vercel.app/icons/${logoName}.png`
    ];

    if (this.token && cleanDomain.includes('.')) {
       urls.push(`https://img.logo.dev/${cleanDomain}?token=${this.token}&size=${size}`);
    } else if (cleanDomain.includes('.')) {
       urls.push(`https://logo.clearbit.com/${cleanDomain}`);
    }

    return urls;
  }
}
