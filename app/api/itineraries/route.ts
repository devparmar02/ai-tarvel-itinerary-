import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase.server';

// Normalise budget_tier from quiz ('upper') to DB-valid value ('premium')
function normaliseBudgetTier(tier: string): string {
  if (tier === 'upper') return 'premium';
  if (['budget', 'mid', 'premium'].includes(tier)) return tier;
  return 'mid';
}

// Normalise travel_mode to DB-valid values
function normaliseTravelMode(mode: string): string {
  if (['train', 'road', 'flight', 'any'].includes(mode)) return mode;
  return 'any';
}

// Normalise traveler_type to DB-valid values
function normaliseTravelerType(type: string): string {
  if (['solo', 'couple', 'group', 'family'].includes(type)) return type;
  return 'solo';
}

// POST /api/itineraries — save itinerary (requires auth)
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceClient();
    const body = await request.json();

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized — please sign in to save itineraries.' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid session — please sign in again.' }, { status: 401 });
    }

    // Normalise values to match DB CHECK constraints
    const budget_tier   = normaliseBudgetTier(body.budget_tier);
    const travel_mode   = normaliseTravelMode(body.travel_mode);
    const traveler_type = normaliseTravelerType(body.traveler_type);

    const { data, error } = await supabase
      .from('itineraries')
      .insert({
        user_id:        user.id,
        destination:    body.destination,
        purpose:        body.purpose || 'weekend_escape',
        days:           Number(body.days) || 3,
        budget_tier,
        travel_mode,
        traveler_type,
        departure_city: body.departure_city || '',
        itinerary_data: body.itinerary_data,
        budget_data:    body.budget_data,
        is_public:      true,  // public so share links work without auth
      })
      .select('id, share_token')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ id: data.id, share_token: data.share_token });
  } catch (error) {
    console.error('Save itinerary error:', error);
    return NextResponse.json({ error: 'Failed to save itinerary. Please try again.' }, { status: 500 });
  }
}

// GET /api/itineraries — list user's saved itineraries
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceClient();
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { data, error } = await supabase
      .from('itineraries')
      .select('id, destination, purpose, days, budget_tier, created_at, share_token, rating')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('List itineraries error:', error);
    return NextResponse.json({ error: 'Failed to fetch itineraries' }, { status: 500 });
  }
}
