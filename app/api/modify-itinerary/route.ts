import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { GROQ_API_KEY } from '@/lib/env';
import type { GeneratedItinerary } from '@/types';

const SYSTEM_PROMPT = `You are a helpful travel itinerary editor for India trips.
You receive an existing itinerary JSON and a user instruction.
Apply the requested change and return the FULL updated itinerary.

RULES:
1. Respond ONLY with valid JSON — no markdown, no explanation.
2. Return the complete itinerary object with the change applied.
3. Keep all days, slots, budget, and waypoints intact — only modify what was asked.
4. If the instruction is unclear or impossible, return {"message": "explanation of why"} instead.
5. Maintain realistic Indian travel context — real places, real costs in INR.`;

export async function POST(request: NextRequest) {
  try {
    const { itinerary, instruction, purpose, budget_tier }: {
      itinerary: GeneratedItinerary;
      instruction: string;
      purpose: string;
      budget_tier: string;
    } = await request.json();

    if (!instruction?.trim() || !itinerary) {
      return NextResponse.json({ error: 'Missing instruction or itinerary' }, { status: 400 });
    }

    const groq = new Groq({ apiKey: GROQ_API_KEY() });

    const prompt = `Existing itinerary for ${itinerary.destination} (${itinerary.days.length} days, ${purpose}, ${budget_tier} budget):

${JSON.stringify(itinerary, null, 2)}

User instruction: "${instruction}"

Apply this change and return the complete updated itinerary JSON.`;

    const completion = await groq.chat.completions.create({
      model:           'llama-3.3-70b-versatile',
      max_tokens:      4096,
      temperature:     0.5,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: prompt },
      ],
    });

    const raw    = completion.choices[0].message.content || '{}';
    const parsed = JSON.parse(raw);

    // If AI returned a message instead of an itinerary
    if (parsed.message && !parsed.days) {
      return NextResponse.json({ message: parsed.message });
    }

    // Validate it looks like an itinerary
    if (!parsed.days || !Array.isArray(parsed.days)) {
      return NextResponse.json({ message: 'Could not apply that change. Try rephrasing.' });
    }

    return NextResponse.json({ itinerary: parsed });

  } catch (err) {
    console.error('Modify itinerary error:', err);
    return NextResponse.json({ error: 'Failed to modify itinerary' }, { status: 500 });
  }
}