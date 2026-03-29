# 🗺️ TripMind — AI Travel Companion for India

> Quiz-first AI trip planner for independent Indian travellers. Purpose-driven. Hidden gems. Free tier first.

## ✨ Features

- **6-question quiz** → personality card → AI itinerary in under 60 seconds
- **AI Destination Discovery** — 3 matched destinations with match %, crowd, weather, cost
- **Day-by-day AI itinerary** with morning/afternoon/evening slots + hidden gems
- **Budget breakdown** — transport, stay, food, activities in INR
- **Interactive route map** (Leaflet + OpenStreetMap — free forever)
- **Google Auth** — save and share itineraries
- **$0/month** for first 1,000 users

---

## 🛠️ Tech Stack

| Layer       | Technology             |
|-------------|------------------------|
| Framework   | Next.js 15 (App Router)|
| Styling     | Tailwind CSS           |
| Database    | Supabase (Postgres)    |
| Auth        | Supabase + Google OAuth|
| AI          | Claude Haiku API       |
| Maps        | Leaflet + OpenStreetMap|
| Photos      | Unsplash API           |
| State       | Zustand                |
| Animations  | Framer Motion          |
| Hosting     | Vercel                 |

---

## 🚀 Quick Start

### 1. Clone & install

```bash
git clone https://github.com/yourusername/ai-travel-companion
cd ai-travel-companion
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Fill in all values in `.env.local` (see below for where to get each key).

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase-migration.sql`
3. Go to **Authentication → Providers** and enable **Google**
4. Copy your Project URL and API keys to `.env.local`

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 API Keys — Where to Get Them

| Variable | Source | Notes |
|----------|--------|-------|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) | Use `claude-haiku-4-5` model |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | |
| `SUPABASE_SERVICE_KEY` | Supabase → Project Settings → API → Service role | Never expose to client |
| `UNSPLASH_ACCESS_KEY` | [unsplash.com/developers](https://unsplash.com/developers) | 50 req/hour free |
| `UPSTASH_REDIS_REST_URL` | [upstash.com](https://upstash.com) | 10K req/day free |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash dashboard | |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) | 15 RPM free |
| `OPENWEATHER_API_KEY` | [openweathermap.org](https://openweathermap.org/api) | 1000 calls/day free |
| `AMADEUS_CLIENT_ID` | [developers.amadeus.com](https://developers.amadeus.com) | Test environment |
| `AMADEUS_CLIENT_SECRET` | Amadeus dashboard | |
| `GEOAPIFY_API_KEY` | [geoapify.com](https://www.geoapify.com) | 3000 req/day free |
| `NEWS_API_KEY` | [newsapi.org](https://newsapi.org) | Free developer tier |

---

## 📦 Deploy to Vercel

```bash
# 1. Push to GitHub
git add . && git commit -m "initial" && git push

# 2. Import to Vercel
# Go to vercel.com → New Project → Import your repo

# 3. Add all environment variables in Vercel dashboard
# Settings → Environment Variables → add each from .env.local

# 4. Deploy
# Vercel auto-deploys on every push to main
```

---

## 🗄️ Database Schema

See `supabase-migration.sql` for full schema with:
- `users` — Google Auth profiles
- `itineraries` — saved AI itineraries with share tokens
- `hidden_gems` — curated low-traffic spots
- `destinations` — 25+ Indian destinations with metadata
- Row Level Security (RLS) policies
- Auto-trigger to create user profile on first sign-in

---

## 📂 Project Structure

```
app/
  page.tsx              # Landing page
  quiz/page.tsx          # 6-step quiz + personality card
  itinerary/page.tsx     # Destination discovery + AI itinerary
  dashboard/page.tsx     # Saved trips (requires auth)
  trip/[token]/page.tsx  # Public shared itinerary
  api/
    generate-itinerary/  # POST — Claude AI itinerary generation
    regenerate-slot/     # POST — Swap a single slot
    destinations/        # GET  — Matched destination discovery
    itineraries/         # GET/POST — Save & list trips
    itineraries/[id]/    # GET/PATCH — Fetch & rate trip

components/
  map/TripMap.tsx        # Leaflet map (dynamic import, no SSR)

lib/
  store.ts              # Zustand global state
  supabase.ts           # Supabase client
  personality.ts        # Quiz → personality mapping

data/
  destinations.ts       # 25 curated Indian destinations + matching logic

types/index.ts          # All TypeScript types
supabase-migration.sql  # Run this in Supabase SQL Editor
```

---

## 💰 Cost at Scale

| Scale | Monthly Cost |
|-------|-------------|
| 0–1,000 users | **$0** |
| 1,000–10,000 users | ~$1 |
| 10,000+ users | ~$51 (Vercel Pro + Supabase Pro) |

---

## 🗓️ 10-Day Build Checklist

See `AI_Travel_Companion_Execution_Plan.docx` for the full day-by-day checklist.

**Day 1:** Setup & infrastructure  
**Day 2–3:** Quiz & personality card  
**Day 4–5:** AI itinerary generation  
**Day 6:** Budget + route map  
**Day 7:** Auth + save + dashboard  
**Day 8:** Destination discovery  
**Day 9:** Safety layer + QA  
**Day 10:** Launch 🚀  

---

## 🔐 Security

- All API keys in server-side env vars only — never in client bundle
- Rate limiting on `/api/generate-itinerary`: 5 requests/IP/hour
- Supabase Row Level Security on all tables
- Share tokens generated with `crypto.randomBytes(16)`
- Input sanitisation on all user text fields (max 100 chars)

---

## 📄 License

MIT — build freely, credit appreciated.

---

*Built for India's independent travellers · $0/month for first 1,000 users*
