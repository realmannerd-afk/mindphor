/**
 * Utility functions for Logo Management System
 */

// Mapping of platform identifiers to their official/primary domains
const PLATFORM_DOMAINS: Record<string, string> = {
  reddit: 'reddit.com',
  app_store: 'appstore',
  play_store: 'play.google.com',
  twitter: 'twitter.com',
  x: 'twitter.com',
  slack: 'slack.com',
  discord: 'discord.com',
  github: 'github.com',
  notion: 'notion.so',
  linear: 'linear.app'
};

// Mapping of competitor/company names to their primary domains
const COMPANY_DOMAINS: Record<string, string> = {
  linear: 'linear.app',
  notion: 'notion.so',
  jira: 'atlassian.com',
  productboard: 'productboard.com',
  mindphor: 'mindphor.com',
  slack: 'slack.com',
  discord: 'discord.com',
  github: 'github.com',
  google: 'google.com',
  apple: 'apple.com',
  twitter: 'twitter.com',
  reddit: 'reddit.com'
};

/**
 * Extract initials from a company/platform name
 */
export function getInitials(name: string): string {
  if (!name) return 'M';
  const cleanName = name.trim().replace(/[^a-zA-Z0-9\s]/g, '');
  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'M';
  if (parts.length === 1) {
    return parts[0].substring(0, Math.min(2, parts[0].length)).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Generate a deterministic brand HSL color based on string hash
 */
export function getBrandColor(name: string): string {
  if (!name) return 'hsl(210, 80%, 55%)';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Keep hues in clean, modern ranges (avoiding muddy colors)
  const hue = Math.abs(hash % 360);
  const saturation = 65 + Math.abs((hash >> 8) % 15); // 65% - 80%
  const lightness = 45 + Math.abs((hash >> 16) % 10);  // 45% - 55%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Resolve domain for a platform
 */
export function resolvePlatformDomain(platform: string): string {
  const key = platform.toLowerCase().trim().replace(/[\s-_]/g, '_');
  return PLATFORM_DOMAINS[key] || `${key}.com`;
}

/**
 * Resolve domain for a competitor/company name
 */
export function resolveCompetitorDomain(name: string): string {
  const clean = name.toLowerCase().trim();
  if (COMPANY_DOMAINS[clean]) return COMPANY_DOMAINS[clean];
  
  // Try checking if any key is a substring
  for (const [key, domain] of Object.entries(COMPANY_DOMAINS)) {
    if (clean.includes(key)) {
      return domain;
    }
  }
  
  // Default fallback construction
  return `${clean.replace(/[^a-z0-9]/g, '')}.com`;
}
