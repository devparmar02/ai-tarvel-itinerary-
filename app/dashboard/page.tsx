'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Tag, ArrowRight, Plus, LogIn, Flame, Heart, Mountain, Zap, Map, Luggage, ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SavedTrip {
  id: string;
  destination: string;
  purpose: string;
  days: number;
  budget_tier: string;
  created_at: string;
  share_token: string;
  rating?: 1 | -1;
}

const PURPOSE_ICONS: Record<string, React.ReactNode> = {
  spiritual:      <Flame    className="w-5 h-5 text-orange-500" />,
  honeymoon:      <Heart    className="w-5 h-5 text-rose-500"   />,
  adventure:      <Mountain className="w-5 h-5 text-blue-500"   />,
  weekend_escape: <Zap      className="w-5 h-5 text-yellow-500" />,
};

export default function DashboardPage() {
  const [user,  setUser]  = useState<{ email?: string; user_metadata?: { full_name?: string; avatar_url?: string } } | null>(null);
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ? { email: user.email, user_metadata: user.user_metadata as { full_name?: string; avatar_url?: string } } : null);
      if (user) fetchTrips(user);
      else setLoading(false);
    });
  }, []);

  async function fetchTrips(currentUser: { id: string }) {
    const session = await supabase.auth.getSession();
    const token   = session.data.session?.access_token;
    if (!token) { setLoading(false); return; }
    const res = await fetch('/api/itineraries', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setTrips(await res.json());
    setLoading(false);
  }

  async function signIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options:  { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-forest border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-forest/10 flex items-center justify-center mb-4">
          <Map className="w-8 h-8 text-forest" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-2">Your Travel Dashboard</h1>
        <p className="text-gray-500 mb-8 max-w-sm">Sign in with Google to save and revisit your itineraries from anywhere.</p>
        <button onClick={signIn} className="btn-primary flex items-center gap-2">
          <LogIn className="w-4 h-4" /> Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="gradient-hero px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            {user.user_metadata?.avatar_url && (
              <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-14 h-14 rounded-full border-2 border-white/40" />
            )}
            <div>
              <h1 className="font-display text-2xl font-bold text-white">
                {user.user_metadata?.full_name || user.email}
              </h1>
              <p className="text-white/60 text-sm">{trips.length} saved {trips.length === 1 ? 'trip' : 'trips'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <Link href="/quiz" className="flex items-center gap-3 card p-4 mb-6 hover:shadow-card-hover transition-shadow group">
          <div className="w-10 h-10 bg-forest/10 rounded-full flex items-center justify-center text-forest group-hover:bg-forest group-hover:text-white transition-colors">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold">Plan a new trip</p>
            <p className="text-xs text-gray-400">Start the quiz again</p>
          </div>
          <ArrowRight className="w-4 h-4 ml-auto text-gray-300 group-hover:text-forest transition-colors" />
        </Link>

        {trips.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Luggage className="w-6 h-6 text-gray-400" />
            </div>
            <p>No saved trips yet. Plan your first!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trips.map((trip, i) => (
              <motion.div key={trip.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link href={`/trip/${trip.share_token}`} className="card-hover p-5 block">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="flex-shrink-0">
                          {PURPOSE_ICONS[trip.purpose] || <Map className="w-5 h-5 text-gray-400" />}
                        </span>
                        <h3 className="font-display font-bold text-lg">{trip.destination}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="flex items-center gap-1 text-gray-500"><Calendar className="w-3 h-3" /> {trip.days} days</span>
                        <span className="flex items-center gap-1 text-gray-500"><Tag className="w-3 h-3" /> {trip.budget_tier}</span>
                        <span className="text-gray-400">{new Date(trip.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      {trip.rating === 1  && <ThumbsUp  className="w-4 h-4 text-green-500" />}
                      {trip.rating === -1 && <ThumbsDown className="w-4 h-4 text-red-400"   />}
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
