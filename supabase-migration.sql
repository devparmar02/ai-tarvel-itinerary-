-- ═══════════════════════════════════════════════════════════════
-- AI Travel Companion — Supabase Migration
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Users (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id                uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             text UNIQUE NOT NULL,
  full_name         text,
  avatar_url        text,
  created_at        timestamptz DEFAULT now(),
  travel_personality text,
  quiz_answers      jsonb
);

-- Itineraries
CREATE TABLE IF NOT EXISTS public.itineraries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES public.users(id) ON DELETE CASCADE,
  created_at      timestamptz DEFAULT now(),
  destination     text NOT NULL,
  purpose         text NOT NULL CHECK (purpose IN ('spiritual','honeymoon','adventure','weekend_escape')),
  days            integer NOT NULL,
  budget_tier     text NOT NULL CHECK (budget_tier IN ('budget','mid','premium')),
  travel_mode     text NOT NULL CHECK (travel_mode IN ('train','road','flight','any')),
  traveler_type   text NOT NULL CHECK (traveler_type IN ('solo','couple','group','family')),
  departure_city  text NOT NULL,
  itinerary_data  jsonb NOT NULL,
  budget_data     jsonb NOT NULL,
  rating          smallint CHECK (rating IN (1, -1)),
  is_public       boolean DEFAULT false,
  share_token     text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex')
);

-- Hidden Gems
CREATE TABLE IF NOT EXISTS public.hidden_gems (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  state            text NOT NULL,
  district         text,
  description      text NOT NULL,
  purpose_tags     text[] NOT NULL,
  travel_mode_tags text[],
  crowd_level      text CHECK (crowd_level IN ('low','medium','high')) DEFAULT 'low',
  best_time_of_year text,
  best_time_of_day  text,
  lat              decimal(9,6),
  lng              decimal(9,6),
  unsplash_query   text,
  is_verified      boolean DEFAULT false,
  created_at       timestamptz DEFAULT now()
);

-- Destinations
CREATE TABLE IF NOT EXISTS public.destinations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL,
  state                 text NOT NULL,
  purpose_tags          text[] NOT NULL,
  budget_tiers          text[],
  crowd_level_by_month  jsonb,
  avg_daily_cost_budget integer,
  avg_daily_cost_mid    integer,
  avg_daily_cost_premium integer,
  weather_summary       text,
  lat                   decimal(9,6),
  lng                   decimal(9,6),
  unsplash_query        text,
  created_at            timestamptz DEFAULT now()
);

-- ── Row Level Security ─────────────────────────────────────────────────────

ALTER TABLE public.users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hidden_gems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;

-- Users: can only see/edit own row
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Itineraries: private by default; public share_token accessible
CREATE POLICY "itineraries_select_own"   ON public.itineraries FOR SELECT USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "itineraries_insert_own"   ON public.itineraries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "itineraries_update_own"   ON public.itineraries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "itineraries_delete_own"   ON public.itineraries FOR DELETE USING (auth.uid() = user_id);

-- Gems & destinations: public read
CREATE POLICY "gems_public_read"  ON public.hidden_gems  FOR SELECT USING (true);
CREATE POLICY "dest_public_read"  ON public.destinations FOR SELECT USING (true);

-- ── Auth trigger: auto-create user row ────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  ) ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS itineraries_user_id_idx   ON public.itineraries(user_id);
CREATE INDEX IF NOT EXISTS itineraries_share_idx     ON public.itineraries(share_token);
CREATE INDEX IF NOT EXISTS gems_state_idx            ON public.hidden_gems(state);
CREATE INDEX IF NOT EXISTS gems_purpose_idx          ON public.hidden_gems USING GIN(purpose_tags);
