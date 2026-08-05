// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import svelte from '@astrojs/svelte';
import vercel from '@astrojs/vercel';
import mdx from '@astrojs/mdx';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.mindphor.com',
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ['@astrojs/cloudflare']
    }
  },

  integrations: [svelte(), mdx(), react(), sitemap()],
  prefetch: true,
  output: 'server',
  adapter: vercel()
});