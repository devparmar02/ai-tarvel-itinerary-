'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Compass, Gem, Wallet, Shield, ArrowRight, Clock, Trash2, Flame, Mountain, Leaf, TreePine, Castle, Map, Heart, Zap } from 'lucide-react';
import { useTravelStore } from '@/lib/store';

const FOREST     = '#2D6A4F';
const TERRACOTTA = '#E07B39';
const CREAM      = '#FDF6EC';
const SAND       = '#F5F5F0';
const INK        = '#1C1C1C';

const FEATURES = [
  { icon: <Compass className="w-6 h-6" />, title: 'Purpose-First Discovery',  desc: "We ask who you are before suggesting where to go. No generic lists." },
  { icon: <Gem     className="w-6 h-6" />, title: 'Real Hidden Gems',         desc: "Waterfalls, sunset ridges, and local dhabas that won't appear on Google." },
  { icon: <Wallet  className="w-6 h-6" />, title: 'Honest Budget Breakdown',  desc: 'Transport, stay, food and activities — all itemised in INR.' },
  { icon: <Shield  className="w-6 h-6" />, title: 'Safety Intelligence',      desc: 'Weather alerts, political disturbance flags, and medical facility locators.' },
];

const PACKAGES = [
  { icon: <Flame className="w-5 h-5 text-orange-500" />,   name: 'Char Dham Yatra',     days: '10–14 days' },
  { icon: <Mountain className="w-5 h-5 text-blue-500" />,  name: 'Leh Ladakh',          days: '7–10 days'  },
  { icon: <Leaf className="w-5 h-5 text-green-500" />,     name: 'South India Darshan', days: '10–14 days' },
  { icon: <TreePine className="w-5 h-5 text-yellow-600" />,name: 'Gujarat Darshan',     days: '5–7 days'   },
  { icon: <Castle className="w-5 h-5 text-purple-500" />,  name: 'Royal Rajasthan',     days: '7–10 days'  },
  { icon: <Leaf className="w-5 h-5 text-emerald-500" />,   name: 'Northeast Explorer',  days: '10–14 days' },
];

const heroGradient: React.CSSProperties = {
  background: 'linear-gradient(160deg, #1E5038 0%, #2D6A4F 40%, #245C43 70%, #1A4530 100%)',
};

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const fadeUp  = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

// ── Quick destination widget ──────────────────────────────────────────────
function QuickDestWidget() {
  const router = useRouter();
  const { setQuizAnswer } = useTravelStore();
  const [dest, setDest] = useState('');

  function go() {
    if (!dest.trim()) return;
    // Store desired destination so itinerary page can skip discovery
    setQuizAnswer('destination', dest.trim() as never);
    router.push('/quiz');
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 max-w-lg mx-auto">
      <p className="text-white/80 text-sm font-semibold mb-3 text-center flex items-center justify-center gap-2">
        Know where you want to go? Enter it directly
      </p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <input
            type="text"
            value={dest}
            onChange={e => setDest(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && go()}
            placeholder="e.g. Leh Ladakh, Goa, Varanasi..."
            className="w-full bg-white/15 border border-white/25 text-white placeholder-white/45 rounded-xl py-3 pl-9 pr-4 text-sm focus:outline-none focus:border-white/60 transition-colors"
          />
        </div>
        <button
          onClick={go}
          disabled={!dest.trim()}
          className="px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          style={{ backgroundColor: TERRACOTTA, color: '#fff' }}
        >
          Go <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      <p className="text-white/40 text-xs text-center mt-2">
        Or <Link href="/quiz" className="underline text-white/60">take the full quiz</Link> to get AI destination suggestions
      </p>
    </div>
  );
}

// ── Recent trips from store ───────────────────────────────────────────────
function RecentTrips() {
  const router = useRouter();
  const { recentTrips, loadRecentTrip, deleteRecentTrip } = useTravelStore();

  if (recentTrips.length === 0) return null;

  const purposeIcon: Record<string, React.ReactNode> = {
    spiritual:      <Flame className="w-3.5 h-3.5 text-orange-500" />,
    honeymoon:      <Heart className="w-3.5 h-3.5 text-rose-500" />,
    adventure:      <Mountain className="w-3.5 h-3.5 text-blue-500" />,
    weekend_escape: <Zap className="w-3.5 h-3.5 text-yellow-500" />,
  };

  return (
    <section className="py-10 px-6" style={{ backgroundColor: '#fff' }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-5">
          <Clock className="w-4 h-4" style={{ color: FOREST }} />
          <h2 className="font-display text-lg font-bold" style={{ color: INK }}>Your recent itineraries</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentTrips.map((trip, i) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="group relative rounded-xl border p-4 hover:border-forest/40 hover:shadow-md transition-all cursor-pointer"
              style={{ backgroundColor: SAND, borderColor: '#E5E7EB' }}
              onClick={() => { loadRecentTrip(trip); router.push('/itinerary'); }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm truncate flex items-center gap-1.5" style={{ color: INK }}>
                    {purposeIcon[trip.purpose] || <Map className="w-3.5 h-3.5 text-gray-400" />}
                    {trip.destination}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                    {trip.days} days · {trip.purpose.replace('_', ' ')}
                  </p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); deleteRecentTrip(trip.id); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-gray-300 hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs" style={{ color: '#9CA3AF' }}>
                  {new Date(trip.savedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(45,106,79,0.1)', color: FOREST }}>
                  View →
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const { setQuizAnswer } = useTravelStore();
  const router = useRouter();

  return (
    <main style={{ minHeight: '100vh', backgroundColor: CREAM }}>

      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-sm"
           style={{ backgroundColor: 'rgba(253,246,236,0.93)', borderBottom: `1px solid ${SAND}` }}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" style={{ color: FOREST }} />
            <span className="font-display font-bold text-lg" style={{ color: FOREST }}>TripMind</span>
          </div>
          <Link href="/quiz" className="text-sm font-semibold px-5 py-2 rounded-lg text-white transition-all hover:opacity-90"
                style={{ backgroundColor: FOREST }}>
            Plan My Trip
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden pt-28 pb-16 px-6" style={heroGradient}>
        <div className="absolute top-20 right-10 w-64 h-64 rounded-full blur-3xl pointer-events-none"
             style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.span
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="inline-block text-xs font-semibold px-4 py-1.5 rounded-full mb-5 tracking-widest uppercase"
            style={{ backgroundColor: 'rgba(255,255,255,0.13)', color: 'rgba(255,255,255,0.9)' }}
          >
            India-First · AI-Powered · Free Forever
          </motion.span>

          <motion.h1
            className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-5"
            style={{ color: '#fff' }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          >
            The best trip starts with<br />
            <span style={{ color: TERRACOTTA }} className="italic">who you are</span>, not where to book.
          </motion.h1>

          <motion.p
            className="text-base mb-8 max-w-xl mx-auto leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.78)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          >
            Enter a destination or take a 6-question quiz. Get a full day-by-day itinerary,
            hidden gems, budget breakdown and route map.
          </motion.p>

          {/* Destination quick-start */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <QuickDestWidget />
          </motion.div>
        </div>
      </section>

      {/* RECENT ITINERARIES */}
      <RecentTrips />

      {/* POPULAR PACKAGES */}
      <section className="py-16 px-6" style={{ backgroundColor: CREAM }}>
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full mb-3"
                  style={{ backgroundColor: FOREST, color: '#fff' }}>
              <Gem className="w-3 h-3" /> Curated Packages
            </span>
            <h2 className="font-display text-3xl font-bold mt-2 mb-2" style={{ color: INK }}>Popular Tour Packages</h2>
            <p className="text-sm" style={{ color: '#6B7280' }}>Pre-planned circuits — click to build your itinerary instantly.</p>
          </motion.div>

          <motion.div className="grid grid-cols-2 sm:grid-cols-3 gap-4"
            variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            {PACKAGES.map(pkg => (
              <motion.div key={pkg.name} variants={fadeUp}>
                <button
                  onClick={() => { setQuizAnswer('destination', pkg.name as never); router.push('/quiz'); }}
                  className="w-full text-left flex items-start gap-3 p-4 rounded-xl border hover:border-forest/50 hover:shadow-md transition-all"
                  style={{ backgroundColor: '#fff', borderColor: SAND }}
                >
                  <div className="w-9 h-9 rounded-lg bg-sand flex items-center justify-center flex-shrink-0">
                    {pkg.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm leading-tight" style={{ color: INK }}>{pkg.name}</p>
                    <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: 'rgba(45,106,79,0.1)', color: FOREST }}>{pkg.days}</span>
                  </div>
                </button>
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-6">
            <Link href="/quiz" className="text-sm font-semibold inline-flex items-center gap-1 hover:underline" style={{ color: FOREST }}>
              See all packages + enter custom destination <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16 px-6" style={{ backgroundColor: '#fff' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-display text-3xl font-bold mb-3" style={{ color: INK }}>What makes this different</h2>
            <p className="max-w-lg mx-auto text-sm" style={{ color: '#6B7280' }}>Every other travel app starts with where. We start with why.</p>
          </motion.div>
          <motion.div className="grid sm:grid-cols-2 gap-5"
            variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            {FEATURES.map(f => (
              <motion.div key={f.title} variants={fadeUp} className="flex gap-4 p-6 rounded-xl border"
                style={{ backgroundColor: '#fff', borderColor: SAND, boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                     style={{ backgroundColor: 'rgba(45,106,79,0.10)', color: FOREST }}>
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: INK }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="py-20 px-6 text-center" style={heroGradient}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="font-display text-4xl font-bold mb-4" style={{ color: '#fff' }}>Ready to travel with purpose?</h2>
          <p className="text-lg mb-8" style={{ color: 'rgba(255,255,255,0.72)' }}>Join travellers discovering India differently.</p>
          <Link href="/quiz"
            className="inline-flex items-center gap-2 font-bold text-lg px-10 py-4 rounded-lg text-white transition-all hover:opacity-90 hover:shadow-xl"
            style={{ backgroundColor: TERRACOTTA }}>
            Plan My Trip — Free <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 text-center text-sm" style={{ backgroundColor: INK, color: 'rgba(255,255,255,0.4)' }}>
        <p>&copy; 2025 TripMind · Built for India&apos;s independent travellers</p>
        <p className="mt-1 text-xs">AI-generated itineraries are suggestions only. Always verify local conditions before travel.</p>
      </footer>
    </main>
  );
}