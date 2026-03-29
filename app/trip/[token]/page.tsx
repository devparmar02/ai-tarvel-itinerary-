import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServiceClient } from '@/lib/supabase.server';
import { Plane, Gem, UtensilsCrossed, Sun, Coffee, Sunset, Moon } from 'lucide-react';
import type { Metadata } from 'next';
import type { ItineraryDay } from '@/types';

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('itineraries')
    .select('destination, purpose')
    .eq('share_token', token)
    .single();

  if (!data) return { title: 'Shared Trip — TripMind' };

  return {
    title: `${data.destination} Trip — TripMind`,
    description: `A ${data.purpose} itinerary for ${data.destination} planned with AI.`,
  };
}

const SLOT_ICONS: Record<string, React.ReactNode> = {
  morning:   <Coffee  className="w-3.5 h-3.5" />,
  afternoon: <Sun     className="w-3.5 h-3.5" />,
  evening:   <Sunset  className="w-3.5 h-3.5" />,
  night:     <Moon    className="w-3.5 h-3.5" />,
};

export default async function SharedTripPage({ params }: PageProps) {
  const { token } = await params;
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('itineraries')
    .select('*')
    .eq('share_token', token)
    .single();

  if (error || !data) notFound();

  const itinerary = data.itinerary_data as { days: ItineraryDay[] };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="gradient-hero px-6 py-12 text-center">
        <p className="text-white/60 text-sm mb-2 flex items-center justify-center gap-1.5">
          <Plane className="w-3.5 h-3.5" /> Shared Itinerary
        </p>
        <h1 className="font-display text-4xl font-bold text-white mb-2">{data.destination}</h1>
        <p className="text-white/70">
          {data.days} days · {data.purpose} · {data.budget_tier} budget
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {itinerary.days.map((day: ItineraryDay) => (
          <div key={day.day} className="card p-5">
            <h2 className="font-display text-xl font-bold mb-4">
              Day {day.day}: {day.title}
            </h2>
            <div className="space-y-3">
              {(['morning', 'afternoon', 'evening'] as const).map(slot => (
                <div key={slot} className="bg-sand rounded-card p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1.5">
                    {SLOT_ICONS[slot]} {slot}
                  </p>
                  <p className="font-semibold text-sm">{day[slot].activity}</p>
                  <p className="text-xs text-gray-400">{day[slot].location}</p>
                </div>
              ))}

              <div className="bg-terracotta/10 rounded-card p-4">
                <span className="gem-badge text-xs mb-2 inline-flex items-center gap-1">
                  <Gem className="w-3 h-3" /> Hidden Gem
                </span>
                <p className="font-semibold text-sm">{day.hidden_gem.name}</p>
                <p className="text-xs text-gray-600">{day.hidden_gem.description}</p>
              </div>

              <div className="flex items-center gap-2 text-sm bg-sand rounded-card px-3 py-2.5">
                <UtensilsCrossed className="w-4 h-4 text-terracotta flex-shrink-0" />
                <span className="font-medium">{day.food.name}</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500">{day.food.cuisine} · {day.food.price_range}</span>
              </div>
            </div>
          </div>
        ))}

        {/* CTA */}
        <div className="card p-6 text-center">
          <p className="font-display text-xl font-bold mb-2">Plan your own trip with AI</p>
          <p className="text-gray-500 text-sm mb-4">Quiz-first. Purpose-driven. Free forever.</p>
          <Link href="/quiz" className="btn-primary inline-block">Start the Quiz</Link>
        </div>
      </div>
    </div>
  );
}
