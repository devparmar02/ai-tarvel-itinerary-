import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import type { TripPurpose, BudgetTier, DestinationCard } from '@/types';
import { GROQ_API_KEY, UNSPLASH_ACCESS_KEY } from '@/lib/env';

const SYSTEM_PROMPT = `You are an expert Indian travel curator with deep knowledge of every state in India.
Suggest diverse, geographically spread travel destinations based on the traveller's profile.

STRICT RULES:
1. Respond ONLY with valid JSON — no markdown, no preamble, no explanation.
2. Respect the distance constraint strictly — do NOT suggest places beyond max_distance_km.
3. Suggest VARIED destinations — different states, different vibes. Never repeat a state.
4. Match the purpose and budget realistically.
5. lat/lng must be accurate real coordinates inside India.
6. avg_daily_cost must be realistic for the budget tier (budget=900, mid=2000, premium=5500 INR/day).`;

function buildPrompt(departure: string, purpose: TripPurpose, budget: BudgetTier, days: number): string {
  // Distance logic: short trips stay close, longer trips can go further
  let maxKm: number;
  let distanceNote: string;

  if (days <= 2) {
    maxKm = 400;
    distanceNote = `Within 400 km only — must be driveable/trainable same day from ${departure}`;
  } else if (days <= 4) {
    maxKm = 900;
    distanceNote = `Within 900 km — overnight train or short flight OK from ${departure}`;
  } else if (days <= 7) {
    maxKm = 1800;
    distanceNote = `Within 1800 km — domestic flight acceptable from ${departure}. Can suggest distant states.`;
  } else {
    maxKm = 99999;
    distanceNote = `Any destination in India — long trip allows full country exploration from ${departure}`;
  }

  const budgetLabel = { budget: 'budget (₹900/day)', mid: 'mid-range (₹2000/day)', premium: 'premium (₹5500/day)' }[budget];

  return `Suggest 6 travel destinations for:
- Departing from: ${departure}
- Purpose: ${purpose}
- Trip duration: ${days} days
- Budget: ${budgetLabel}
- Distance rule: ${distanceNote}

IMPORTANT: For trips of 5+ days, suggest destinations from DIFFERENT regions of India, not just nearby states.
Mix well-known and offbeat places. Each must be a different state.

Return ONLY this JSON:
{
  "destinations": [
    {
      "id": "ai-1",
      "name": "Place Name",
      "state": "State Name",
      "match_pct": 94,
      "purpose_tags": ["${purpose}"],
      "crowd_level": "Low",
      "weather_summary": "Best time and weather tip",
      "avg_daily_cost": 1800,
      "estimated_total": ${days * 1800},
      "lat": 0.0,
      "lng": 0.0,
      "unsplash_query": "place name india scenic landscape"
    }
  ]
}`;
}

async function fetchPhoto(query: string, apiKey: string): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${apiKey}` } },
    );
    const data = await res.json();
    return data?.results?.[0]?.urls?.regular;
  } catch {
    return undefined;
  }
}

function fallbackDestinations(purpose: TripPurpose, budget: BudgetTier, days: number): DestinationCard[] {
  const cost = { budget: 900, mid: 2000, premium: 5500 }[budget];
  const map: Record<TripPurpose, Array<{ name: string; state: string; lat: number; lng: number }>> = {
    adventure:      [
      { name: 'Rishikesh',    state: 'Uttarakhand',   lat: 30.0869, lng: 78.2676 },
      { name: 'Coorg',        state: 'Karnataka',      lat: 12.3375, lng: 75.8069 },
      { name: 'Spiti Valley', state: 'Himachal Pradesh', lat: 32.2464, lng: 78.0353 },
      { name: 'Hampi',        state: 'Karnataka',      lat: 15.3350, lng: 76.4600 },
      { name: 'Ziro Valley',  state: 'Arunachal Pradesh', lat: 27.5453, lng: 93.8314 },
      { name: 'Chopta',       state: 'Uttarakhand',   lat: 30.3977, lng: 79.2052 },
    ],
    spiritual:      [
      { name: 'Varanasi',     state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739 },
      { name: 'Pushkar',      state: 'Rajasthan',      lat: 26.4897, lng: 74.5511 },
      { name: 'Tirupati',     state: 'Andhra Pradesh', lat: 13.6288, lng: 79.4192 },
      { name: 'Amritsar',     state: 'Punjab',         lat: 31.6340, lng: 74.8723 },
      { name: 'Bodh Gaya',    state: 'Bihar',          lat: 24.6961, lng: 84.9913 },
      { name: 'Dwarka',       state: 'Gujarat',        lat: 22.2374, lng: 68.9676 },
    ],
    honeymoon:      [
      { name: 'Munnar',       state: 'Kerala',         lat: 10.0889, lng: 77.0595 },
      { name: 'Udaipur',      state: 'Rajasthan',      lat: 24.5854, lng: 73.7125 },
      { name: 'Alleppey',     state: 'Kerala',         lat: 9.4981,  lng: 76.3388 },
      { name: 'Andaman',      state: 'Andaman & Nicobar', lat: 11.9780, lng: 92.9990 },
      { name: 'Coorg',        state: 'Karnataka',      lat: 12.3375, lng: 75.8069 },
      { name: 'Darjeeling',   state: 'West Bengal',    lat: 27.0360, lng: 88.2627 },
    ],
    weekend_escape: [
      { name: 'Lonavala',     state: 'Maharashtra',    lat: 18.7537, lng: 73.4064 },
      { name: 'Mahabaleshwar', state: 'Maharashtra',   lat: 17.9237, lng: 73.6574 },
      { name: 'Coorg',        state: 'Karnataka',      lat: 12.3375, lng: 75.8069 },
      { name: 'Munnar',       state: 'Kerala',         lat: 10.0889, lng: 77.0595 },
      { name: 'Kasol',        state: 'Himachal Pradesh', lat: 32.0093, lng: 77.3146 },
      { name: 'Pondicherry',  state: 'Puducherry',     lat: 11.9416, lng: 79.8083 },
    ],
  };
  return map[purpose].map((d, i) => ({
    id: `fallback-${i + 1}`,
    name: d.name,
    state: d.state,
    match_pct: Math.max(70, 92 - i * 4),
    purpose_tags: [purpose],
    crowd_level: (i % 2 === 0 ? 'Low' : 'Medium') as 'Low' | 'Medium',
    weather_summary: 'Check local weather before travel.',
    avg_daily_cost: cost,
    estimated_total: cost * days,
    lat: d.lat,
    lng: d.lng,
    unsplash_query: `${d.name} ${d.state} india travel`,
  }));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const purpose   = (searchParams.get('purpose')  || 'weekend_escape') as TripPurpose;
  const budget    = (searchParams.get('budget')   || 'mid')            as BudgetTier;
  const days      = parseInt(searchParams.get('days') || '3', 10);
  const departure = searchParams.get('departure') || 'Mumbai';

  let destinations: DestinationCard[];

  try {
    const groq     = new Groq({ apiKey: GROQ_API_KEY() });
    const prompt   = buildPrompt(departure, purpose, budget, days);

    const completion = await groq.chat.completions.create({
      model:           'llama-3.3-70b-versatile',
      max_tokens:      2048,
      temperature:     0.75,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: prompt },
      ],
    });

    const raw    = completion.choices[0].message.content || '{}';
    const parsed = JSON.parse(raw);

    const arr: DestinationCard[] =
      parsed.destinations ??
      parsed.results ??
      (Array.isArray(parsed) ? parsed : Object.values(parsed)[0]) ??
      [];

    destinations = (arr as DestinationCard[]).slice(0, 6).map((d, i) => ({
      ...d,
      id:              `ai-${i + 1}`,
      estimated_total: (d.avg_daily_cost ?? 1800) * days,
      match_pct:       Math.min(99, d.match_pct ?? 85),
    }));

    if (destinations.length === 0) throw new Error('Empty response from AI');

  } catch (err) {
    console.error('AI destination generation failed, using fallback:', err);
    destinations = fallbackDestinations(purpose, budget, days);
  }

  // Attach Unsplash photos
  const unsplashKey = UNSPLASH_ACCESS_KEY();
  if (unsplashKey) {
    destinations = await Promise.all(
      destinations.map(async (dest) => ({
        ...dest,
        photo_url: await fetchPhoto(dest.unsplash_query, unsplashKey),
      })),
    );
  }

  return NextResponse.json(destinations);
}