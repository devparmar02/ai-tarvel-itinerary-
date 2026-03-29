import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import type { RegenerateSlotRequest, TimeSlot } from '@/types';
import { GROQ_API_KEY } from '@/lib/env';
import { checkRateLimit } from '@/lib/ratelimit';

export async function POST(request: NextRequest) {
  // ── Rate limiting (stricter — 20/min per IP) ───────────────────────────
  const rl = await checkRateLimit(request, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment and try again.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  try {
    const body: RegenerateSlotRequest = await request.json();
    const { day_index, slot, destination, purpose, context } = body;

    const prompt = `You are an expert Indian travel planner. Regenerate only the ${slot} slot for Day ${day_index + 1} of a trip to ${destination}.

Purpose: ${purpose}
Context (what was in the other slots this day): ${context}

Respond ONLY with valid JSON for a single slot — no preamble, no markdown:
{
  "activity": "",
  "location": "",
  "duration_minutes": 90,
  "why_it_fits": "",
  "best_time": "",
  "distance_km": 0
}

Make it different from the previous suggestion. Keep it authentic and local.`;

    // Instantiate per-request so missing key throws here, not at module load
    const groq = new Groq({ apiKey: GROQ_API_KEY() });

    const completion = await groq.chat.completions.create({
      model:       'llama-3.3-70b-versatile',
      max_tokens:  512,
      temperature: 0.7,
      messages: [
        { role: 'system', content: 'You are an expert Indian travel planner. Always respond with valid JSON only. No markdown, no explanation.' },
        { role: 'user',   content: prompt },
      ],
    });

    const raw     = completion.choices[0].message.content ?? '';
    const cleaned = raw.replace(/```json\n?|```\n?/g, '').trim();
    const newSlot: TimeSlot = JSON.parse(cleaned);

    return NextResponse.json(newSlot);
  } catch (error) {
    console.error('Regenerate slot error:', error);
    return NextResponse.json({ error: 'Failed to regenerate slot' }, { status: 500 });
  }
}
