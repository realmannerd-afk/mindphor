// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import svelte from '@astrojs/svelte';
import vercel from '@astrojs/vercel';
import mdx from '@astrojs/mdx';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ['@astrojs/cloudflare']
    },
    ssr: {
      noExternal: ['google-play-scraper', 'memoizee', 'es5-ext']
    }
  },

  integrations: [svelte(), mdx(), react()],
  prefetch: true,
  output: 'server',
  adapter: vercel({
    excludeFiles: ['**/node_modules/es5-ext/**'],
  })
});