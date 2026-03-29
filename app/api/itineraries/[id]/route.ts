import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase.server';

// GET /api/itineraries/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('itineraries')
      .select('*')
      .or(`id.eq.${id},share_token.eq.${id}`)
      .single();

    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!data.is_public) {
      // Require auth for private itineraries — validate the token properly
      const authHeader = request.headers.get('Authorization');
      if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
      if (authErr || !user || user.id !== data.user_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch itinerary' }, { status: 500 });
  }
}

// PATCH /api/itineraries/[id] — rate or update
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getServiceClient();
    const body = await request.json();

    // Rating doesn't require auth (anonymous feedback)
    if (body.rating !== undefined) {
      const { error } = await supabase
        .from('itineraries')
        .update({ rating: body.rating })
        .eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // Other updates require auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { error } = await supabase
      .from('itineraries')
      .update(body)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update itinerary' }, { status: 500 });
  }
}
