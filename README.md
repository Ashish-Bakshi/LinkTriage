# LinkTriage 📑⚡

A mobile-first, responsive Progressive Web App (PWA) designed to quickly save, triage, and manage educational and professional resources (links from LinkedIn, X, Instagram Reels, YouTube, and articles). Features multi-device account synchronization via Supabase, instant metadata extraction, custom "Add to Home Screen" installation, and seamless Vercel deployment.

---

## 🚀 Key Features

- **📱 Mobile-First PWA & Installability**:
  - Valid `manifest.json` with 192x192 and 512x512 standard and maskable icons.
  - Service worker (`sw.js`) for caching app shell resources and offline fallback.
  - Custom Add to Home Screen (A2HS) banner supporting Android/Chrome one-click install and guided iOS Safari instructions.
  - App Shortcuts to immediately open the "Quick Add" modal from your mobile home screen.

- **📊 The "Acquisition & Resources" Board**:
  - Interactive **Kanban Board** with columns: **Inbox / To-Do**, **In Progress**, and **Completed**.
  - **Structured Data Table View** toggle for high-density overview and inline status editing.
  - Color-coded priority indicators (**Red** for High with pulse indicator, **Amber** for Medium, **Emerald** for Low).
  - Rich category pills (*Client Acquisition*, *Finance/Tax*, *Tech Skills*, *Leadership*, *Productivity*, *Marketing*, or custom categories).
  - One-tap status triage buttons on mobile cards and desktop drag-and-drop.

- **🔍 Auto-Metadata Scraping API (`/api/scrape-metadata`)**:
  - Server-side Next.js route parses Open Graph and Twitter Card tags to extract `<title>`, description, thumbnail, and website name.
  - Automatically identifies target platform (LinkedIn, X, Instagram, YouTube, Web) based on URL hostname.
  - Friendly fallback title generation for protected social media pages.

- **⚡ Multi-Device Sync & Supabase Auth**:
  - Email & Password authentication and Google OAuth.
  - PostgreSQL schema with strict **Row Level Security (RLS)** ensuring users only query and mutate their own saved links.
  - Real-time updates via Supabase channels.
  - Built-in **Demo Mode Sandbox**: Works out of the box with sample data and localStorage caching even before Supabase credentials are configured.

---

## 🛠️ Tech Stack

- **Framework**: Next.js (App Router, Turbopack, TypeScript)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React + custom platform SVGs
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security)
- **HTML Parsing**: Cheerio
- **PWA**: Custom Service Worker + Web App Manifest
- **Deployment**: Vercel

---

## 🏁 Getting Started

### 1. Clone & Install Dependencies

```bash
git clone <your-repo-url>
cd linktriage
npm install
```

### 2. Configure Environment Variables (Optional for Live Supabase Sync)

Copy the example environment configuration:

```bash
cp .env.example .env.local
```

Fill in your Supabase project credentials in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> **Note**: If you run without these variables, LinkTriage automatically activates **Instant Demo Mode**, saving your links in your browser's local storage with sample resources so you can test everything right away.

### 3. Supabase Database Setup

Run the SQL migration in `supabase/schema.sql` inside the Supabase SQL Editor:

```sql
-- Creates resources table with RLS and updated_at trigger
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    source_platform TEXT NOT NULL CHECK (source_platform IN ('LinkedIn', 'X', 'Instagram', 'YouTube', 'Web')),
    category VARCHAR(100) NOT NULL DEFAULT 'Tech Skills',
    priority TEXT NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
    status TEXT NOT NULL CHECK (status IN ('Inbox', 'In Progress', 'Completed')),
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own resources"
    ON public.resources FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚢 Deploying to Vercel

1. Push your code to GitHub.
2. Import the repository in [Vercel](https://vercel.com/new).
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**. Vercel will automatically build and deploy your Next.js PWA.

---

## 📱 Installing on Mobile Devices

### iOS (Safari):
1. Open your deployed LinkTriage URL in Safari.
2. Tap the **Share** button (box with an upward arrow) at the bottom.
3. Tap **Add to Home Screen**.
4. The app icon will appear on your home screen and open in standalone app mode without browser chrome.

### Android (Chrome):
1. Open the app in Chrome.
2. Tap the custom **Install App** banner at the bottom or open Chrome settings and tap **Install app**.
