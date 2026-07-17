# Mindphor

> Real-time Play Store feedback, AI sentiment analysis, and competitor monitoring in one powerful dashboard.

Mindphor automatically monitors customer feedback, app ratings, and competitor trends in real time using AI. It aggregates reviews from the Google Play Store and Reddit, providing you with deep, actionable insights to understand your users and stay ahead of your rivals.

---

## 🚀 Key Features

- **Feedback Traceability**  
  Aggregate and filter raw user feedback from the Play Store and Reddit in a single intuitive table. Slice data by sentiment, source, or specific competitor.
  
- **Competitor Intelligence**  
  Monitor your closest rivals with side-by-side sentiment tracking and dedicated competitor profiles to see exactly where they are failing and how you can capitalize.

- **Actionable AI Insights**  
  Every piece of negative feedback is automatically analyzed to generate a specific, tactical action plan. Stop just reading complaints and start fixing them.

- **Deep Alert Analysis**  
  Stay ahead of the curve with deep contextual alerts. Instantly view affected sources, raw evidence, and automated action plans for critical issues.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Astro](https://astro.build/) (v6) |
| **UI Library** | React & Svelte (Multi-framework islands) |
| **Styling** | Tailwind CSS (v4) + Framer Motion + MagicUI |
| **Backend & API** | Astro Serverless API Routes |
| **Database & Auth** | Supabase (PostgreSQL) |
| **Scraping Engine** | `google-play-scraper` (bundled via Vite) |
| **Deployment** | Vercel |

---

## 💻 Local Development

### Prerequisites
- Node.js `>=22.12.0`
- A Supabase project with valid API keys

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/realmannerd-afk/mindphor.git
   cd mindphor
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   PUBLIC_SUPABASE_URL=your-supabase-url
   PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   *Your app will be running at `http://localhost:4321/`*

---

## 📝 Important Architecture Notes

- **App Store Scraper**: The `app-store-scraper` dependency has been removed to bypass a known Vercel `ELOOP` deployment bug. Apple App Store ingestion currently utilizes an honest fallback (returns an empty array).
- **Vite Bundling**: `google-play-scraper` and its dependencies (`memoizee`, `es5-ext`) are heavily integrated and bundled via Vite's `ssr.noExternal` config in `astro.config.mjs` to prevent Vercel Node File Trace (NFT) crashes. A postinstall script also removes recursive symlink bugs native to `es5-ext`.

---

## 📄 License

MIT © Mindphor