import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import type { GenerateItineraryRequest, GeneratedItinerary } from '@/types';
import { GROQ_API_KEY } from '@/lib/env';
import { checkRateLimit } from '@/lib/ratelimit';

// ── Purpose-specific guidance ──────────────────────────────────────────────
const PURPOSE_CONTEXT: Record<string, { tone: string; priorities: string; avoid: string; food_style: string }> = {
  spiritual: {
    tone: 'Calm, reverent, introspective. Use language that evokes peace, stillness, and inner journey.',
    priorities: 'Temples at dawn before crowds arrive, aarti ceremonies, meditation ghats, ashrams, sacred forests, lesser-known shrines with deep local significance, priest-guided rituals, chanting sessions.',
    avoid: 'Nightclubs, loud markets, commercial tourist traps, anything that breaks the contemplative mood.',
    food_style: 'Sattvic vegetarian — temple prasad, ashram langar, ancient local thalis. Specific named eateries only.',
  },
  honeymoon: {
    tone: 'Romantic, intimate, sensory. Write like you are setting a scene — golden light, the sound of water, the scent of jasmine.',
    priorities: 'Sunrise/sunset viewpoints for two, heritage havelis, candlelit terrace dinners, boat rides, couples experiences, private garden walks, stargazing spots, moonlit ghats.',
    avoid: 'Crowded buses, budget hostels, group tours, anything rushed or unromantic.',
    food_style: 'Romantic dinners at rooftop restaurants, local delicacies presented beautifully, fine chai experiences.',
  },
  adventure: {
    tone: 'Bold, kinetic, visceral. Describe the burn in the legs, the altitude headrush, the cold river spray.',
    priorities: 'Treks to viewpoints locals know, river crossings, cliff trails, village homestays mid-trek, night sky camps at altitude, white-water entry points, suspension bridges, cycling routes.',
    avoid: 'Malls, AC hotels, passive sightseeing, anything sedentary.',
    food_style: 'High-calorie trek food — aloo paranthas, maggi at hilltop dhabas, local mountain cuisine.',
  },
  weekend_escape: {
    tone: 'Unhurried, restorative, warm. The goal is decompression — slow mornings, quality over quantity.',
    priorities: 'Max 2-3 activities per day, long lunches, cafe-hopping, lazy lakeside walks, hammock spots, local bazaar wandering at your own pace.',
    avoid: 'Packed schedules, pre-dawn starts, exhausting multi-hour drives between spots.',
    food_style: 'Cafe breakfasts, local street food at leisure, one indulgent meal, filter coffee or chai with a view.',
  },
};

const BUDGET_CONTEXT: Record<string, { daily_inr: number; stay: string; food: string; transport: string }> = {
  budget:  { daily_inr: 1200, stay: 'Dormitory hostels, dharamshalas (Rs.300-600/night)', food: 'Street food, dhabas, thali meals (Rs.80-200/meal)', transport: 'Shared autos, state buses, sleeper trains' },
  mid:     { daily_inr: 3000, stay: 'Boutique guesthouses, heritage homestays (Rs.1000-2000/night)', food: 'Sit-down restaurants, local specialty eateries (Rs.200-600/meal)', transport: '3AC train, private cabs for short hops' },
  upper:   { daily_inr: 5000, stay: 'Comfortable 3-4 star hotels, curated homestays (Rs.2000-4000/night)', food: 'Quality restaurants, rooftop dining (Rs.500-1200/meal)', transport: '2AC train, comfortable private car' },
  premium: { daily_inr: 9000, stay: 'Heritage palace hotels, boutique luxury resorts (Rs.4000+/night)', food: 'Fine dining, private setups, celebrity chef restaurants (Rs.1000-3000/meal)', transport: 'Private car with driver, business class flights' },
};

const SYSTEM_PROMPT = `You are Priya — a veteran Indian travel curator who has personally explored every corner of India over 15 years. You write itineraries that feel like letters from a knowledgeable friend: specific, vivid, deeply local.

IRON RULES FOR BEGINNERS:
1. Respond ONLY with valid JSON. Zero preamble, zero markdown, zero text outside the JSON.
2. Every activity must be SPECIFIC — name the actual place with vivid detail. Never say "visit a temple" when you can say "Mrityunjaya Mahadev Temple, a 9th-century Pratihara-era shrine".
3. why_it_fits must directly connect the activity to THIS traveller's purpose and personality — never generic filler.
4. Hidden gems must be genuinely obscure — NOT on the first two pages of Google results. Describe them like you personally discovered them.
5. Food must be a specific named dish or establishment with context — never "a local restaurant".
6. Day titles must be evocative story-like phrases, not bland labels.
7. Waypoints must have accurate lat/lng for the actual location — never use 0.0.
8. Budget must be mathematically consistent: transport + stay + food + activities + buffer = total.
9. Do NOT repeat the same activity category across days (if Day 1 has a temple, Day 2 offers a market, nature, craft, or performance instead).
10. FEASIBILITY: Calculate actual travel time from departure to destination. If Day 1 is mostly transit, title it accordingly and scale back activities. If the trip is physically impossible, warn in feasibility_warning.
11. BEGINNER FOCUS: Include practical tips, what to pack, local customs, emergency contacts, and step-by-step guidance for first-time travelers.
12. COMPLETE JOURNEY: Cover from leaving home city to returning home — include travel logistics, airport/train station details, and return journey planning.`;

function buildPrompt(req: GenerateItineraryRequest): string {
  const ctx = PURPOSE_CONTEXT[req.purpose] || PURPOSE_CONTEXT.weekend_escape;
  const budget = BUDGET_CONTEXT[req.budget_tier] || BUDGET_CONTEXT.mid;
  const totalBudget = budget.daily_inr * req.days;

  return `Craft a ${req.days}-day COMPLETE itinerary for a BEGINNER traveler. Every word must earn its place. Cover the ENTIRE journey from home to destination and back.

TRAVELLER PROFILE:
- Destination: ${req.destination}
- Departing from: ${req.departure_city}
- Trip purpose: ${req.purpose.replace('_', ' ')}
- Travel personality: ${req.personality}
- Group type: ${req.traveler_type}
- Preferred travel mode: ${req.travel_mode}
- Budget tier: ${req.budget_tier} (~Rs.${budget.daily_inr.toLocaleString()}/day/person)
- EXPERIENCE LEVEL: BEGINNER (first-time traveler to India)

PURPOSE: ${req.purpose.toUpperCase().replace('_', ' ')}
Tone: ${ctx.tone}
Prioritise: ${ctx.priorities}
Avoid: ${ctx.avoid}
Food style: ${ctx.food_style}

BUDGET REALITY:
- Stay: ${budget.stay}
- Food: ${budget.food}
- Transport: ${budget.transport}
- Daily per person: Rs.${budget.daily_inr.toLocaleString()}
- Total (${req.days} days): Rs.${totalBudget.toLocaleString()}

BEGINNER TRAVEL ESSENTIALS TO INCLUDE:
- Step-by-step travel from ${req.departure_city} to ${req.destination}
- What to pack for Indian weather and culture
- Local customs and etiquette tips
- Emergency contacts and safety basics
- Money management (ATMs, cards, cash)
- Communication (SIM cards, WiFi, apps)
- Health precautions and medications
- Return journey planning
- Post-trip recovery tips

QUALITY STANDARDS FOR EACH FIELD:
- activity: Named experience with vivid 1-line description (e.g. "Pre-dawn Ganga Aarti at Dashashwamedh Ghat — 108 oil lamps, priests in silk, chanting that resonates in your chest at 5am")
- location: Exact place name + brief orientation (e.g. "Dashashwamedh Ghat, Varanasi's oldest and most sacred ghat, 8 min walk from Godowlia crossing")
- why_it_fits: 2 sentences specifically connecting this to the traveller's ${req.purpose.replace('_', ' ')} purpose and ${req.traveler_type} group type
- hidden_gem description: 3-4 sentences — what it is, why it's special, sensory details, local secret about it, best time and why
- food: Named dish or restaurant with a story ("Blue Lassi Shop's rose petal lassi — served in clay kulhads at this 70-year-old family stall on Kachouri Gali, Rs.60")

BEGINNER TIPS TO WEAVE IN:
- beginner_tip: One practical tip for first-time travelers (e.g., "Download offline maps of your destination before leaving home")
- cultural_note: One cultural insight relevant to the activity
- safety_reminder: One specific safety consideration for this activity

Return ONLY this exact JSON structure with all ${req.days} days fully filled:
{
  "personality": "${req.personality}",
  "destination": "${req.destination}",
  "days": [
    {
      "day": 1,
      "title": "Evocative story-like title covering travel to destination",
      "morning":   { "activity": "specific vivid activity", "location": "exact place + orientation", "duration_minutes": 90,  "why_it_fits": "2 sentences for this traveller", "best_time": "Early morning", "distance_km": 0, "beginner_tip": "practical tip", "cultural_note": "cultural insight", "safety_reminder": "safety consideration" },
      "afternoon": { "activity": "different category from morning", "location": "exact place + orientation", "duration_minutes": 150, "why_it_fits": "2 sentences", "best_time": "Daytime", "distance_km": 3, "beginner_tip": "practical tip", "cultural_note": "cultural insight", "safety_reminder": "safety consideration" },
      "evening":   { "activity": "evening-appropriate activity", "location": "exact place + orientation", "duration_minutes": 90,  "why_it_fits": "2 sentences", "best_time": "Sunset", "distance_km": 2, "beginner_tip": "practical tip", "cultural_note": "cultural insight", "safety_reminder": "safety consideration" },
      "hidden_gem": { "name": "specific obscure place name", "description": "3-4 sentences written like personal discovery", "distance_km": 5, "best_time": "time with reason", "lat": 0.0, "lng": 0.0 },
      "food": { "name": "named dish or restaurant with brief story", "cuisine": "specific regional cuisine", "price_range": "Rs.XX-XX per person" },
      "estimated_cost_inr": ${budget.daily_inr}
    }
  ],
  "budget": {
    "transport": 0, "stay": 0, "food": 0, "activities": 0,
    "buffer": 0, "total": ${totalBudget}, "is_over_budget": false, "stated_budget_inr": ${totalBudget}
  },
  "waypoints": [
    { "day": 1, "name": "specific location", "lat": 0.0, "lng": 0.0, "is_gem": false }
  ],
  "weather_note": "Specific, actionable tip for ${req.destination}: best months, monsoon timing, what to pack",
  "safety_note": "One specific safety tip relevant to ${req.destination} and ${req.purpose.replace('_', ' ')} travel",
  "feasibility_warning": "",
  "beginner_essentials": {
    "packing_list": ["essential items for beginners"],
    "emergency_contacts": ["local emergency numbers"],
    "cultural_tips": ["key customs to know"],
    "travel_logistics": "step-by-step from ${req.departure_city} to ${req.destination}",
    "return_journey": "how to get back home safely"
  }
}`;
}

function fallbackItinerary(req: GenerateItineraryRequest): GeneratedItinerary {
  const budget = BUDGET_CONTEXT[req.budget_tier] || BUDGET_CONTEXT.mid;
  const days = Array.from({ length: req.days }, (_, i) => ({
    day: i + 1,
    title: `Day ${i + 1} in ${req.destination}`,
    morning:    { activity: 'Explore the old quarters on foot', location: req.destination, duration_minutes: 120, why_it_fits: 'Morning light is the best for exploration.',  best_time: 'Early morning', distance_km: 0, beginner_tip: 'Download offline maps before your trip', cultural_note: 'Always remove shoes before entering temples', safety_reminder: 'Keep valuables in front pockets' },
    afternoon:  { activity: 'Local market and street food walk', location: req.destination, duration_minutes: 120, why_it_fits: 'Markets reveal the real rhythm of a place.',   best_time: 'Daytime',       distance_km: 2, beginner_tip: 'Try bargaining politely at markets', cultural_note: 'Use right hand for eating and giving', safety_reminder: 'Stay aware of your surroundings in crowded areas' },
    evening:    { activity: 'Sunset viewpoint and dinner',       location: req.destination, duration_minutes: 90,  why_it_fits: 'Every town has a perfect sunset spot.',      best_time: 'Sunset',        distance_km: 1, beginner_tip: 'Carry a scarf for covering shoulders at religious sites', cultural_note: 'Join locals for evening prayers when possible', safety_reminder: 'Share your location with someone back home' },
    hidden_gem: { name: 'Ask your host for the local secret', description: 'Every Indian town hides a spot the guidebooks miss — the chai stall where locals gather at 6am, the temple tank no tourist visits, the hilltop path only shepherds know. Ask your accommodation host tonight.', distance_km: 5, best_time: 'Morning', lat: 0, lng: 0 },
    food:       { name: 'Local thali at the busiest dhaba on the main street', cuisine: 'Regional Indian', price_range: 'Rs.80-200 per person' },
    estimated_cost_inr: budget.daily_inr,
  }));

  return {
    personality: req.personality,
    destination: req.destination,
    days,
    budget: {
      transport: Math.round(budget.daily_inr * req.days * 0.25),
      stay: Math.round(budget.daily_inr * req.days * 0.40),
      food: Math.round(budget.daily_inr * req.days * 0.20),
      activities: Math.round(budget.daily_inr * req.days * 0.08),
      buffer: Math.round(budget.daily_inr * req.days * 0.07),
      total: budget.daily_inr * req.days,
      is_over_budget: false,
      stated_budget_inr: budget.daily_inr * req.days,
    },
    waypoints: [{ day: 1, name: req.destination, lat: 20.5937, lng: 78.9629, is_gem: false }],
    weather_note: 'Check local weather forecasts before travel and pack layers for temperature variation.',
    safety_note: 'Keep digital and physical copies of all important documents.',
    feasibility_warning: 'Note: Using fallback itinerary — AI generation was temporarily unavailable. Refresh to try again.',
    beginner_essentials: {
      packing_list: ['Light cotton clothes', 'Comfortable walking shoes', 'Sunscreen', 'Reusable water bottle', 'Power adapter', 'Basic medications'],
      emergency_contacts: ['Local police: 100', 'Tourist helpline: 1363', 'Your hotel/accommodation contact'],
      cultural_tips: ['Remove shoes at religious sites', 'Use right hand for eating', 'Dress modestly at temples', 'Learn basic Hindi greetings'],
      travel_logistics: `Travel from ${req.departure_city} to ${req.destination} by ${req.travel_mode}. Book tickets in advance and arrive 2 hours early.`,
      return_journey: `Plan your return journey from ${req.destination} to ${req.departure_city}. Keep extra time for traffic/delays and have backup transport options.`
    }
  };
}

// ── Normalise budget_tier from quiz to DB-valid values ─────────────────────
function normaliseBudgetTier(tier: string): 'budget' | 'mid' | 'premium' {
  if (tier === 'upper') return 'premium';
  if (tier === 'budget' || tier === 'mid' || tier === 'premium') return tier;
  return 'mid';
}

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment and try again.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  try {
    const body: GenerateItineraryRequest = await request.json();

    if (!body.destination || !body.purpose || !body.days) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Normalise budget tier before using it
    body.budget_tier = normaliseBudgetTier(body.budget_tier) as GenerateItineraryRequest['budget_tier'];

    const groq   = new Groq({ apiKey: GROQ_API_KEY() });
    const prompt = buildPrompt(body);
    let itinerary: GeneratedItinerary;

    try {
      const completion = await groq.chat.completions.create({
        model:           'llama-3.3-70b-versatile',
        max_tokens:      8192,
        temperature:     0.75,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: prompt },
        ],
      });

      const raw = completion.choices[0].message.content || '{}';
      itinerary = JSON.parse(raw);
    } catch (aiError) {
      console.error('Groq API error, using fallback:', aiError);
      itinerary = fallbackItinerary(body);
    }

    return NextResponse.json(itinerary);
  } catch (error) {
    console.error('Generate itinerary error:', error);
    return NextResponse.json({ error: 'Failed to generate itinerary' }, { status: 500 });
  }
}
