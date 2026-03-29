'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Wallet, RefreshCw, ThumbsUp, ThumbsDown, Save, Share2, Clock, MapPin, Coffee, Sun, Sunset, Moon, CheckCircle, Loader2, ArrowRight, Home, Download, Flame, Mountain, Leaf, Anchor, Castle, TreePine, Snowflake, Landmark, Waves, Gem, UtensilsCrossed, AlertTriangle, Info, Smile, Frown, Package, PenLine, Sparkles, Users, Train } from 'lucide-react';
import { useTravelStore } from '@/lib/store';
import { parseDaysNumber } from '@/lib/personality';
import type { DestinationCard, GeneratedItinerary, TimeSlot, ItineraryDay } from '@/types';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';

const TripMap = dynamic(() => import('@/components/map/TripMap'), { ssr: false, loading: () => <div className="w-full h-64 skeleton rounded-card" /> });

const TIPS = [
  'Did you know? India has 40 UNESCO World Heritage Sites.',
  'Tip: Train travel in India is 3× cheaper than road trips for long distances.',
  "Hidden gem rule: If a place appears on page 3 of Google, it's worth visiting.",
  'Budget hack: Eating at dhabas saves ₹300–600 per day versus restaurants.',
  'The best sunsets in India? Hampi, Spiti, and Rann of Kutch — all off the beaten path.',
  'Solo travel in India: Always inform someone of your itinerary. Safety first.',
];

function LoadingState({ message }: { message?: string }) {
  const [tip, setTip] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTip((i: number) => (i + 1) % TIPS.length), 2500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-full bg-forest/10 flex items-center justify-center">
          <Map className="w-9 h-9 text-forest animate-pulse-slow" />
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-forest/30 animate-ping" />
      </div>
      <h2 className="font-display text-2xl font-bold mb-2 text-ink">{message || 'Crafting your itinerary…'}</h2>
      <p className="text-gray-500 text-sm mb-8">Our AI is handpicking hidden gems just for you. Hang tight.</p>
      <AnimatePresence mode="wait">
        <motion.div key={tip} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white rounded-card p-4 max-w-sm text-sm text-gray-600 shadow-card flex items-start gap-2">
          <Info className="w-4 h-4 text-forest flex-shrink-0 mt-0.5" />
          {TIPS[tip]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Pre-made tour packages ────────────────────────────────────────────────
const PACKAGE_ICONS: Record<string, React.ReactNode> = {
  'pkg-1': <Flame className="w-6 h-6 text-orange-500" />,
  'pkg-2': <Mountain className="w-6 h-6 text-blue-500" />,
  'pkg-3': <Leaf className="w-6 h-6 text-green-500" />,
  'pkg-4': <TreePine className="w-6 h-6 text-yellow-600" />,
  'pkg-5': <Castle className="w-6 h-6 text-purple-500" />,
  'pkg-6': <Leaf className="w-6 h-6 text-emerald-500" />,
  'pkg-7': <Snowflake className="w-6 h-6 text-sky-400" />,
  'pkg-8': <Landmark className="w-6 h-6 text-amber-600" />,
  'pkg-9': <Waves className="w-6 h-6 text-teal-500" />,
};

const PACKAGES = [
  { id: 'pkg-1', name: 'Char Dham Yatra',       destination: 'Char Dham (Yamunotri, Gangotri, Kedarnath, Badrinath)',  desc: 'The sacred four shrines of Uttarakhand',          days: '10–14 days', tags: ['spiritual'] },
  { id: 'pkg-2', name: 'Leh Ladakh',            destination: 'Leh Ladakh, Jammu & Kashmir',                           desc: 'High altitude passes, monasteries & Pangong Lake', days: '7–10 days', tags: ['adventure', 'honeymoon'] },
  { id: 'pkg-3', name: 'South India Darshan',   destination: 'South India (Kerala, Tamil Nadu, Karnataka)',            desc: 'Temples, backwaters, hills & beaches',             days: '10–14 days', tags: ['spiritual', 'honeymoon'] },
  { id: 'pkg-4', name: 'Gujarat Darshan',        destination: 'Gujarat (Rann of Kutch, Gir, Dwarka, Somnath)',         desc: 'Deserts, lions, heritage & temples',               days: '5–7 days',  tags: ['spiritual', 'adventure'] },
  { id: 'pkg-5', name: 'Royal Rajasthan',        destination: 'Rajasthan (Jaipur, Jodhpur, Jaisalmer, Udaipur)',       desc: 'Forts, palaces, deserts & royal culture',          days: '7–10 days', tags: ['honeymoon', 'weekend_escape'] },
  { id: 'pkg-6', name: 'Northeast Explorer',    destination: 'Northeast India (Meghalaya, Assam, Arunachal Pradesh)', desc: 'Living root bridges, rhinos & tribal culture',     days: '10–14 days', tags: ['adventure', 'weekend_escape'] },
  { id: 'pkg-7', name: 'Himalayan Circuit',     destination: 'Himachal Pradesh (Shimla, Manali, Spiti, Dharamshala)', desc: 'Snow peaks, valleys & Buddhist monasteries',       days: '8–12 days', tags: ['adventure', 'honeymoon'] },
  { id: 'pkg-8', name: 'Golden Triangle',       destination: 'Delhi, Agra & Jaipur',                                  desc: 'India\'s most iconic heritage triangle',           days: '4–6 days',  tags: ['spiritual', 'weekend_escape'] },
  { id: 'pkg-9', name: 'Kerala Backwaters',     destination: 'Kerala (Alleppey, Munnar, Thekkady, Kovalam)',          desc: 'Houseboats, tea hills & pristine beaches',         days: '6–8 days',  tags: ['honeymoon', 'weekend_escape'] },
];

function DestinationCards({ destinations, onSelect }: { destinations: DestinationCard[]; onSelect: (d: DestinationCard) => void }) {
  const crowdColor: Record<string, string> = { Low: 'text-green-600 bg-green-50', Medium: 'text-yellow-600 bg-yellow-50', High: 'text-red-600 bg-red-50' };
  const [customDest, setCustomDest] = useState('');
  const [activeTab, setActiveTab]   = useState<'ai' | 'packages' | 'custom'>('ai');

  return (
    <div className="min-h-screen bg-cream px-4 py-10">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Where do you want to go?</h1>
          <p className="text-gray-500 text-sm">Pick a destination below, choose a curated tour, or type your own.</p>
        </motion.div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-sand rounded-xl p-1 mb-8">
          {([['ai', 'AI Picks'], ['packages', 'Tour Packages'], ['custom', 'My Own']] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-xs sm:text-sm font-semibold py-2.5 rounded-lg transition-all ${activeTab === tab ? 'bg-white text-forest shadow-sm' : 'text-gray-500 hover:text-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* AI Picks Tab */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            {destinations.map((dest, i) => (
              <motion.div key={dest.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                className="card-hover p-5 cursor-pointer group" onClick={() => onSelect(dest)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="font-display text-lg font-bold group-hover:text-forest transition-colors">{dest.name}</h2>
                    <p className="text-xs text-gray-400">{dest.state}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="text-xl font-bold text-forest">{dest.match_pct}%</div>
                    <div className="text-xs text-gray-400">match</div>
                  </div>
                </div>
                {dest.photo_url && (
                  <div className="h-28 rounded-card overflow-hidden mb-3">
                    <img src={dest.photo_url} alt={dest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className={`purpose-tag ${crowdColor[dest.crowd_level]}`}><Users className="w-3 h-3" /> {dest.crowd_level} crowd</span>
                  <span className="purpose-tag bg-blue-50 text-blue-600"><Sun className="w-3 h-3" /> {dest.weather_summary}</span>
                  <span className="purpose-tag bg-forest/10 text-forest">₹{dest.estimated_total.toLocaleString()} est. total</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Tour Packages Tab */}
        {activeTab === 'packages' && (
          <div className="space-y-4">
            {PACKAGES.map((pkg, i) => (
              <motion.div key={pkg.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="card-hover p-5 cursor-pointer group"
                onClick={() => onSelect({ id: pkg.id, name: pkg.destination, state: 'Multi-state', match_pct: 99, purpose_tags: [], crowd_level: 'Medium', weather_summary: 'Check season before booking', avg_daily_cost: 2000, estimated_total: 0, lat: 20.5937, lng: 78.9629, unsplash_query: pkg.name + ' india travel' })}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-forest/10 flex items-center justify-center flex-shrink-0">
                    {PACKAGE_ICONS[pkg.id] || <Package className="w-5 h-5 text-forest" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-display text-lg font-bold group-hover:text-forest transition-colors">{pkg.name}</h2>
                      <span className="text-xs bg-forest/10 text-forest px-2 py-0.5 rounded-full shrink-0">{pkg.days}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{pkg.desc}</p>
                    <p className="text-xs text-gray-400 mt-1.5 truncate flex items-center gap-1"><MapPin className="w-3 h-3 inline-block" /> {pkg.destination}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Custom Destination Tab */}
        {activeTab === 'custom' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="card p-6">
              <h3 className="font-display text-lg font-bold mb-1">Enter your own destination</h3>
              <p className="text-sm text-gray-500 mb-5">Type any place in India — city, region, or landmark — and we&apos;ll build a full itinerary for it.</p>
              <div className="relative mb-4">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  className="input-field pl-10 text-base"
                  placeholder="e.g. Spiti Valley, Andaman, Varanasi..."
                  value={customDest}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomDest(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter' && customDest.trim().length >= 2) {
                    onSelect({ id: 'custom', name: customDest.trim(), state: '', match_pct: 99, purpose_tags: [], crowd_level: 'Medium', weather_summary: '', avg_daily_cost: 2000, estimated_total: 0, lat: 20.5937, lng: 78.9629, unsplash_query: customDest + ' india travel' });
                  }}}
                  autoFocus
                />
              </div>
              <button
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={customDest.trim().length < 2}
                onClick={() => onSelect({ id: 'custom', name: customDest.trim(), state: '', match_pct: 99, purpose_tags: [], crowd_level: 'Medium', weather_summary: '', avg_daily_cost: 2000, estimated_total: 0, lat: 20.5937, lng: 78.9629, unsplash_query: customDest + ' india travel' })}
              >
                Build Itinerary for {customDest.trim() || '…'} →
              </button>
            </div>
            <p className="text-center text-xs text-gray-400">Our AI will craft a personalised day-by-day plan for your chosen destination.</p>
          </motion.div>
        )}

      </div>
    </div>
  );
}

const TIME_ICONS: Record<string, React.ReactNode> = {
  'Early morning': <Coffee className="w-4 h-4" />,
  'Daytime':       <Sun className="w-4 h-4" />,
  'Sunset':        <Sunset className="w-4 h-4" />,
  'Night':         <Moon className="w-4 h-4" />,
};

function SlotCard({ slot, label, onRegenerate, regenerating }: { slot: TimeSlot; label: string; onRegenerate: () => void; regenerating: boolean }) {
  return (
    <div className="bg-sand rounded-card p-4 relative group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {TIME_ICONS[slot.best_time] || <Clock className="w-4 h-4" />}
          {label}
        </div>
        <button onClick={onRegenerate} disabled={regenerating} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-forest disabled:cursor-wait" title="Regenerate this slot">
          <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin text-forest' : ''}`} />
        </button>
      </div>
      <h4 className="font-semibold text-sm mb-1">{slot.activity}</h4>
      <p className="text-xs text-gray-500 flex items-center gap-1 mb-1"><MapPin className="w-3 h-3" /> {slot.location}</p>
      <p className="text-xs text-gray-400 italic">{slot.why_it_fits}</p>
    </div>
  );
}

function BudgetCard({ budget }: { budget: GeneratedItinerary['budget'] }) {
  const items = [
    { label: 'Transport',    value: budget.transport,  icon: <Train className="w-4 h-4" /> },
    { label: 'Stay',         value: budget.stay,       icon: <Home className="w-4 h-4" /> },
    { label: 'Food',         value: budget.food,       icon: <UtensilsCrossed className="w-4 h-4" /> },
    { label: 'Activities',   value: budget.activities, icon: <Sparkles className="w-4 h-4" /> },
    { label: 'Buffer (10%)', value: budget.buffer,     icon: <Wallet className="w-4 h-4" /> },
  ];
  return (
    <div className="card p-5 mt-4">
      <h3 className="font-display font-bold text-lg mb-4">Budget Breakdown</h3>
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="text-forest">{item.icon}</span>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{item.label}</span>
                <span className="font-semibold">₹{item.value.toLocaleString()}</span>
              </div>
              <div className="h-1.5 bg-sand rounded-full overflow-hidden">
                <div className="h-full bg-forest rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (item.value / budget.total) * 100)}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className={`mt-4 p-3 rounded-card flex items-center justify-between ${budget.is_over_budget ? 'bg-red-50' : 'bg-forest/10'}`}>
        <span className="font-bold text-lg">Total</span>
        <div className="text-right">
          <div className={`text-xl font-bold ${budget.is_over_budget ? 'text-red-600' : 'text-forest'}`}>₹{budget.total.toLocaleString()}</div>
          {budget.is_over_budget && <div className="text-xs text-red-500">Over your stated budget</div>}
        </div>
      </div>
    </div>
  );
}

// ── AI Modify Panel ───────────────────────────────────────────────────────
function ModifyPanel({ itinerary, onUpdate }: { itinerary: GeneratedItinerary; onUpdate: (updated: GeneratedItinerary) => void }) {
  const { quizAnswers } = useTravelStore();
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [reply, setReply]     = useState('');

  const SUGGESTIONS = [
    'Replace Day 2 morning with a local market visit',
    'Add a waterfall stop somewhere in the trip',
    'Swap the evening activity on Day 1 with something romantic',
    'Add a budget-friendly street food experience each day',
    'Include a sunrise hike on one of the days',
  ];

  async function handleModify() {
    if (!input.trim() || loading) return;
    setLoading(true);
    setReply('');
    try {
      const res = await fetch('/api/modify-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itinerary,
          instruction: input.trim(),
          purpose: quizAnswers.purpose,
          budget_tier: quizAnswers.budget || 'mid',
        }),
      });
      if (!res.ok) throw new Error('Modify failed');
      const data = await res.json();
      if (data.itinerary) { onUpdate(data.itinerary); setReply('SUCCESS: Itinerary updated!'); setInput(''); }
      else if (data.message) setReply(data.message);
    } catch {
      setReply('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card mb-4 overflow-hidden">
      <button
        onClick={() => setOpen((o: boolean) => !o)}
        className="w-full flex items-center justify-between p-5 hover:bg-sand/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-forest/10 flex items-center justify-center">
            <PenLine className="w-4 h-4 text-forest" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm">Modify this itinerary</p>
            <p className="text-xs text-gray-400">Ask AI to replace, add, or swap anything</p>
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} className="text-gray-400">
          <ArrowRight className="w-4 h-4 rotate-90" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-sand pt-4">
              {/* Quick suggestion chips */}
              <div className="flex flex-wrap gap-2 mb-4">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="text-xs px-3 py-1.5 rounded-full bg-sand hover:bg-forest/10 hover:text-forest transition-colors text-gray-600"
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Freeform input */}
              <textarea
                rows={3}
                value={input}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                placeholder="e.g. Replace Day 1 afternoon with a visit to a local waterfall, or add a cooking class on Day 3..."
                className="w-full border border-sand rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-forest transition-colors bg-sand/40"
              />

              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={handleModify}
                  disabled={!input.trim() || loading}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating…</> : <>Apply Change</>}
                </button>
                {reply && (
                  <p className={`text-xs flex items-center gap-1 ${reply.startsWith('SUCCESS') ? 'text-forest' : 'text-red-500'}`}>
                    {reply.startsWith('SUCCESS')
                      ? <><CheckCircle className="w-3.5 h-3.5" /> Itinerary updated!</>
                      : reply}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ItineraryView({ itinerary }: { itinerary: GeneratedItinerary }): React.ReactElement {
  const router = useRouter();
  const { activeDay, setActiveDay, showMap, toggleMap, showBudget, toggleBudget, quizAnswers, personality, savedId, shareToken, setSavedId, resetQuiz } = useTravelStore();
  const [rated, setRated]               = useState<1 | -1 | null>(null);
  const [saving, setSaving]             = useState(false);
  const [saveStatus, setSaveStatus]     = useState<'idle' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError]       = useState<string>('');
  const [copied, setCopied]             = useState(false);
  const [downloading, setDownloading]   = useState(false);
  const [regenerating, setRegenerating] = useState<{ dayIdx: number; slot: string } | null>(null);
  const [localItinerary, setLocalItinerary] = useState(itinerary);

  // Keep local copy in sync if the parent passes a fresh itinerary (e.g. after auto-generation)
  useEffect(() => {
    setLocalItinerary(itinerary);
  }, [itinerary]);
  const day = localItinerary.days[activeDay];

  function handleHome() {
    resetQuiz();
    router.push('/');
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const d = localItinerary;

      // Build a styled HTML document for PDF printing
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${d.destination} Itinerary — TripMind</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;600&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'DM Sans', sans-serif; background: #FDF6EC; color: #1C1C1C; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { font-family: 'Playfair Display', serif; font-size: 32px; color: #2D6A4F; margin-bottom: 4px; }
    h2 { font-family: 'Playfair Display', serif; font-size: 20px; color: #1C1C1C; margin-bottom: 12px; }
    h3 { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #6B7280; margin-bottom: 6px; }
    .header { background: linear-gradient(135deg, #2D6A4F, #1E5038); color: white; padding: 32px; border-radius: 16px; margin-bottom: 32px; }
    .header h1 { color: white; font-size: 36px; margin-bottom: 8px; }
    .header p { color: rgba(255,255,255,0.75); font-size: 14px; }
    .header .meta { display: flex; gap: 24px; margin-top: 16px; }
    .header .meta span { background: rgba(255,255,255,0.15); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .day-card { background: white; border-radius: 16px; padding: 28px; margin-bottom: 24px; box-shadow: 0 2px 16px rgba(0,0,0,0.07); page-break-inside: avoid; }
    .day-title { font-family: 'Playfair Display', serif; font-size: 22px; color: #2D6A4F; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #F5F5F0; }
    .slot { background: #F5F5F0; border-radius: 10px; padding: 14px 16px; margin-bottom: 10px; }
    .slot-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #9CA3AF; margin-bottom: 4px; }
    .slot-activity { font-weight: 600; font-size: 15px; margin-bottom: 2px; }
    .slot-location { font-size: 12px; color: #6B7280; }
    .slot-why { font-size: 12px; color: #4B5563; margin-top: 6px; font-style: italic; }
    .gem-box { background: #FDF0E8; border: 1.5px solid #E07B39; border-radius: 10px; padding: 14px 16px; margin: 12px 0; }
    .gem-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #E07B39; margin-bottom: 6px; }
    .gem-name { font-weight: 700; font-size: 15px; margin-bottom: 4px; }
    .gem-desc { font-size: 13px; color: #4B5563; line-height: 1.6; }
    .food-box { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-top: 1px solid #F5F5F0; margin-top: 12px; }
    .food-name { font-weight: 600; font-size: 14px; }
    .food-meta { font-size: 12px; color: #6B7280; margin-top: 2px; }
    .day-cost { text-align: right; font-size: 13px; color: #9CA3AF; margin-top: 8px; }
    .day-cost strong { color: #2D6A4F; }
    .budget-card { background: #2D6A4F; color: white; border-radius: 16px; padding: 28px; margin-bottom: 24px; }
    .budget-card h2 { color: white; margin-bottom: 20px; }
    .budget-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.15); font-size: 14px; }
    .budget-row:last-child { border: none; font-weight: 700; font-size: 16px; margin-top: 4px; }
    .notes { background: white; border-radius: 12px; padding: 20px; margin-bottom: 24px; font-size: 13px; color: #4B5563; line-height: 1.7; }
    .notes h3 { margin-bottom: 8px; }
    .footer { text-align: center; font-size: 12px; color: #9CA3AF; margin-top: 32px; padding-top: 16px; border-top: 1px solid #F5F5F0; }
    @media print {
      body { background: white; padding: 20px; }
      .day-card, .budget-card { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${d.destination}</h1>
    <p>${d.personality}</p>
    <div class="meta">
      <span>${d.days.length} Days</span>
      ${quizAnswers.purpose ? `<span>${quizAnswers.purpose.replace('_', ' ')}</span>` : ''}
      ${quizAnswers.budget ? `<span>${quizAnswers.budget} budget</span>` : ''}
    </div>
  </div>

  ${d.days.map((day: ItineraryDay) => `
  <div class="day-card">
    <div class="day-title">Day ${day.day}: ${day.title}</div>

    <div class="slot">
      <div class="slot-label">Morning</div>
      <div class="slot-activity">${day.morning.activity}</div>
      <div class="slot-location">${day.morning.location}</div>
      ${day.morning.why_it_fits ? `<div class="slot-why">${day.morning.why_it_fits}</div>` : ''}
    </div>

    <div class="slot">
      <div class="slot-label">Afternoon</div>
      <div class="slot-activity">${day.afternoon.activity}</div>
      <div class="slot-location">${day.afternoon.location}</div>
      ${day.afternoon.why_it_fits ? `<div class="slot-why">${day.afternoon.why_it_fits}</div>` : ''}
    </div>

    <div class="slot">
      <div class="slot-label">Evening</div>
      <div class="slot-activity">${day.evening.activity}</div>
      <div class="slot-location">${day.evening.location}</div>
      ${day.evening.why_it_fits ? `<div class="slot-why">${day.evening.why_it_fits}</div>` : ''}
    </div>

    <div class="gem-box">
      <div class="gem-label">Hidden Gem</div>
      <div class="gem-name">${day.hidden_gem.name}</div>
      <div class="gem-desc">${day.hidden_gem.description}</div>
      <div style="font-size:12px;color:#E07B39;margin-top:6px;">Best time: ${day.hidden_gem.best_time}</div>
    </div>

    <div class="food-box">
      <div>
        <div class="food-name">${day.food.name}</div>
        <div class="food-meta">${day.food.cuisine} &middot; ${day.food.price_range}</div>
      </div>
    </div>

    <div class="day-cost">Day ${day.day} estimated cost: <strong>&#8377;${day.estimated_cost_inr.toLocaleString()}</strong></div>
  </div>
  `).join('')}

  <div class="budget-card">
    <h2>Budget Breakdown</h2>
    <div class="budget-row"><span>Transport</span><span>&#8377;${d.budget.transport.toLocaleString()}</span></div>
    <div class="budget-row"><span>Accommodation</span><span>&#8377;${d.budget.stay.toLocaleString()}</span></div>
    <div class="budget-row"><span>Food &amp; Dining</span><span>&#8377;${d.budget.food.toLocaleString()}</span></div>
    <div class="budget-row"><span>Activities</span><span>&#8377;${d.budget.activities.toLocaleString()}</span></div>
    <div class="budget-row"><span>Buffer (10%)</span><span>&#8377;${d.budget.buffer.toLocaleString()}</span></div>
    <div class="budget-row"><span>TOTAL</span><span>&#8377;${d.budget.total.toLocaleString()}</span></div>
  </div>

  ${d.weather_note || d.safety_note ? `
  <div class="notes">
    ${d.weather_note ? `<h3>Weather &amp; Packing</h3><p>${d.weather_note}</p>` : ''}
    ${d.safety_note  ? `<h3 style="margin-top:12px">Safety</h3><p>${d.safety_note}</p>` : ''}
  </div>` : ''}

  <div class="footer">
    <p>Generated by TripMind &mdash; AI-powered travel planning for India</p>
    <p style="margin-top:4px">Always verify local conditions before travel</p>
  </div>
</body>
</html>`;

      // Open in new tab so user can Print → Save as PDF
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
        // Trigger print dialog after fonts load
        setTimeout(() => win.print(), 800);
      } else {
        // Fallback: download as HTML file
        const blob = new Blob([html], { type: 'text/html' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = d.destination.replace(/[^a-z0-9]/gi, '_') + '_itinerary.html';
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setDownloading(false);
    }
  }

  async function regenerateSlot(dayIdx: number, slot: 'morning' | 'afternoon' | 'evening') {
    if (regenerating) return;
    setRegenerating({ dayIdx, slot });
    const currentDay = localItinerary.days[dayIdx];
    const context = (['morning', 'afternoon', 'evening'] as const)
      .filter(s => s !== slot)
      .map(s => `${s}: ${currentDay[s].activity} at ${currentDay[s].location}`)
      .join('; ');
    try {
      const res = await fetch('/api/regenerate-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itinerary_id: savedId || '', day_index: dayIdx, slot, destination: localItinerary.destination, purpose: quizAnswers.purpose || 'weekend_escape', context }),
      });
      if (!res.ok) throw new Error('Regeneration failed');
      const newSlot = await res.json();
      setLocalItinerary((prev: GeneratedItinerary) => ({ ...prev, days: prev.days.map((d: ItineraryDay, i: number) => i === dayIdx ? { ...d, [slot]: newSlot } : d) }));
    } catch (err) {
      console.error('Regenerate error:', err);
    } finally {
      setRegenerating(null);
    }
  }

  async function handleSave() {
    if (saving || saveStatus === 'saved') return;
    setSaving(true);
    setSaveError('');
    try {
      const session = await supabase.auth.getSession();
      const token   = session.data.session?.access_token;
      if (!token) {
        // Prompt sign-in — save state to sessionStorage so it survives redirect
        sessionStorage.setItem('tripmind_pending_save', '1');
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: `${window.location.origin}/itinerary` },
        });
        return;
      }
      const res = await fetch('/api/itineraries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          destination:    localItinerary.destination,
          purpose:        quizAnswers.purpose || 'weekend_escape',
          days:           localItinerary.days.length,
          budget_tier:    quizAnswers.budget || 'mid',
          travel_mode:    quizAnswers.travelMode || 'any',
          traveler_type:  quizAnswers.travelerType || 'solo',
          departure_city: quizAnswers.departureCity || '',
          itinerary_data: localItinerary,
          budget_data:    localItinerary.budget,
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Save failed (${res.status})`);
      }
      const { id, share_token } = await res.json();
      setSavedId(id, share_token);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Save error:', err);
      const msg = err instanceof Error ? err.message : 'Save failed. Please try again.';
      setSaveError(msg);
      setSaveStatus('error');
      setTimeout(() => { setSaveStatus('idle'); setSaveError(''); }, 5000);
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    // If already saved, use existing share token
    let token = shareToken;

    if (!token) {
      // Need to save first — check if logged in
      const session = await supabase.auth.getSession();
      if (!session.data.session?.access_token) {
        // Not logged in — copy a notice instead of a real link
        try {
          await navigator.clipboard.writeText(
            `Check out my ${localItinerary.destination} trip planned with TripMind! Sign in at ${window.location.origin} to save and share your own.`
          );
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
        } catch { /* clipboard blocked */ }
        return;
      }
      await handleSave();
      token = useTravelStore.getState().shareToken;
    }

    if (!token) return;
    const url = `${window.location.origin}/trip/${token}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `My ${localItinerary.destination} trip`, text: 'Check out my AI-planned itinerary!', url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch { /* clipboard blocked */ }
    }
  }

  async function handleRate(value: 1 | -1) {
    setRated(value);
    const id = savedId || useTravelStore.getState().savedId;
    if (!id) return;
    try {
      await fetch(`/api/itineraries/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rating: value }) });
    } catch (err) { console.error('Rating error:', err); }
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="gradient-hero px-6 pt-12 pb-16">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-white/70 text-sm mb-2 uppercase tracking-widest">{localItinerary.personality}</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">{localItinerary.destination}</h1>
          {localItinerary.weather_note && <p className="text-white/70 text-sm flex items-center justify-center gap-1"><Sun className="w-3.5 h-3.5" /> {localItinerary.weather_note}</p>}
          {localItinerary.feasibility_warning && (
            <div className="mt-3 bg-yellow-400/20 border border-yellow-300/40 rounded-card px-4 py-2 text-yellow-100 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 flex-shrink-0" /> {localItinerary.feasibility_warning}</div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 -mt-8 pb-20">
        {/* Top bar: Home + Download */}
        <div className="flex gap-2 mb-3">
          <button onClick={handleHome} className="flex items-center gap-1.5 px-3 py-2 rounded-btn border-2 border-sand bg-white text-ink hover:border-forest text-xs font-semibold transition-colors">
            <Home className="w-3.5 h-3.5" /> Home
          </button>
          <button onClick={handleDownload} disabled={downloading} className="flex items-center gap-1.5 px-3 py-2 rounded-btn border-2 border-sand bg-white text-ink hover:border-forest text-xs font-semibold transition-colors disabled:opacity-50">
            <Download className="w-3.5 h-3.5" /> {downloading ? 'Preparing…' : 'PDF'}
          </button>
        </div>
        <div className="flex gap-3 mb-3">
          <button onClick={toggleMap} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-btn text-sm font-semibold border-2 transition-colors ${showMap ? 'border-forest bg-forest text-white' : 'border-sand bg-white text-ink'}`}>
            <Map className="w-4 h-4" /> Route Map
          </button>
          <button onClick={toggleBudget} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-btn text-sm font-semibold border-2 transition-colors ${showBudget ? 'border-forest bg-forest text-white' : 'border-sand bg-white text-ink'}`}>
            <Wallet className="w-4 h-4" /> Budget
          </button>
          <button onClick={handleSave} disabled={saving || saveStatus === 'saved'} title={saveStatus === 'saved' ? 'Saved!' : 'Save itinerary'} className={`flex items-center justify-center w-10 h-10 rounded-btn border-2 transition-colors ${saveStatus === 'saved' ? 'border-forest bg-forest text-white' : 'border-sand bg-white text-ink hover:border-forest'}`}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveStatus === 'saved' ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          </button>
          <button onClick={handleShare} title={copied ? 'Link copied!' : 'Share itinerary'} className={`flex items-center justify-center w-10 h-10 rounded-btn border-2 transition-colors ${copied ? 'border-forest bg-forest text-white' : 'border-sand bg-white text-ink hover:border-forest'}`}>
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {copied && <p className="text-center text-xs text-forest mb-3 flex items-center justify-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Share link copied to clipboard!</p>}
        {saveStatus === 'error' && <p className="text-center text-xs text-red-500 mb-3">{saveError || 'Failed to save. Please sign in and try again.'}</p>}

        <AnimatePresence>
          {showMap && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-5">
              <TripMap waypoints={localItinerary.waypoints} />
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showBudget && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-5">
              <BudgetCard budget={localItinerary.budget} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Modify Panel */}
        <ModifyPanel itinerary={localItinerary} onUpdate={setLocalItinerary} />

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {localItinerary.days.map((d: ItineraryDay, i: number) => (
            <button key={i} onClick={() => setActiveDay(i)} className={i === activeDay ? 'day-tab-active whitespace-nowrap' : 'day-tab-inactive whitespace-nowrap'}>Day {d.day}</button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeDay} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <div className="card p-5 mb-4">
              <h2 className="font-display text-xl font-bold mb-4">Day {day.day}: {day.title}</h2>
              <div className="space-y-3 mb-5">
                {(['morning', 'afternoon', 'evening'] as const).map(slot => (
                  <SlotCard key={slot} slot={day[slot]} label={slot.charAt(0).toUpperCase() + slot.slice(1)} onRegenerate={() => regenerateSlot(activeDay, slot)} regenerating={regenerating?.dayIdx === activeDay && regenerating?.slot === slot} />
                ))}
              </div>
              <div className="bg-terracotta/10 border border-terracotta/30 rounded-card p-4 mb-4">
                <div className="flex items-center gap-2 mb-2"><span className="gem-badge"><Gem className="w-3 h-3" /> Hidden Gem</span></div>
                <h4 className="font-semibold text-sm mb-1">{day.hidden_gem.name}</h4>
                <p className="text-xs text-gray-600">{day.hidden_gem.description}</p>
                <p className="text-xs text-gray-400 mt-1">Best time: {day.hidden_gem.best_time}</p>
              </div>
              <div className="flex items-center gap-3 bg-sand rounded-card px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-terracotta/10 flex items-center justify-center flex-shrink-0">
                  <UtensilsCrossed className="w-4 h-4 text-terracotta" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{day.food.name}</p>
                  <p className="text-xs text-gray-500">{day.food.cuisine} · {day.food.price_range}</p>
                </div>
              </div>
            </div>
            <p className="text-right text-xs text-gray-400 mb-6">Estimated Day {day.day} cost: <span className="font-semibold text-forest">₹{day.estimated_cost_inr.toLocaleString()}</span></p>
          </motion.div>
        </AnimatePresence>

        {!rated ? (
          <div className="card p-5 text-center">
            <p className="font-semibold mb-3">Is this itinerary genuinely useful?</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => handleRate(1)} className="flex items-center gap-2 px-6 py-2.5 rounded-btn bg-forest/10 text-forest font-semibold hover:bg-forest hover:text-white transition-colors">
                <ThumbsUp className="w-4 h-4" /> Yes!
              </button>
              <button onClick={() => handleRate(-1)} className="flex items-center gap-2 px-6 py-2.5 rounded-btn bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition-colors">
                <ThumbsDown className="w-4 h-4" /> Not really
              </button>
            </div>
          </div>
        ) : (
          <div className="card p-4 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
            {rated === 1
              ? <><Smile className="w-4 h-4 text-forest" /> Thanks! Your feedback helps us improve.</>
              : <><Frown className="w-4 h-4 text-gray-400" /> Sorry to hear that. We&apos;ll do better.</>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ItineraryPage() {
  const router = useRouter();
  const { quizAnswers, personality, destinations, selectedDest, itinerary, isGenerating, setDestinations, selectDest, setItinerary, setGenerating } = useTravelStore();
  const [error, setError]                     = useState<string | null>(null);
  const [loadingDestinations, setLoadingDest] = useState(false);
  const redirected = useRef(false);
  const autoGenerated = useRef(false);

  // Redirect to quiz only if no destination, no purpose, and no existing itinerary
  useEffect(() => {
    if (!quizAnswers.purpose && !quizAnswers.destination && !itinerary && !redirected.current) {
      redirected.current = true;
      router.push('/quiz');
    }
  }, [quizAnswers.purpose, quizAnswers.destination, itinerary, router]);

  // Auto-generate when destination is pre-set (from home page or packages)
  useEffect(() => {
    if (!quizAnswers.destination || itinerary || isGenerating || autoGenerated.current) return;
    if (!quizAnswers.departureCity) return; // wait until short quiz is done
    autoGenerated.current = true;
    generateItinerary(quizAnswers.destination);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizAnswers.destination, quizAnswers.departureCity, itinerary]);

  // Normal flow: load AI destination suggestions when no destination pre-set
  useEffect(() => {
    if (quizAnswers.destination) return; // skip if destination already chosen
    if (!quizAnswers.purpose || !quizAnswers.departureCity || destinations.length > 0 || loadingDestinations) return;
    const days = parseDaysNumber(quizAnswers.days);
    const params = new URLSearchParams({ purpose: quizAnswers.purpose, budget: quizAnswers.budget || 'mid', days: String(days), departure: quizAnswers.departureCity || '' });
    setLoadingDest(true);
    fetch(`/api/destinations?${params}`)
      .then(r => r.json())
      .then(data => { setDestinations(data); setLoadingDest(false); })
      .catch(() => { setError('Failed to load destinations. Please try again.'); setLoadingDest(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizAnswers.purpose, quizAnswers.departureCity]);

  useEffect(() => {
    if (!selectedDest || itinerary || isGenerating) return;
    generateItinerary(selectedDest.name);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDest?.id]);

  async function generateItinerary(destination: string) {
    const purpose = quizAnswers.purpose || 'weekend_escape';
    if (isGenerating) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, purpose, days: parseDaysNumber(quizAnswers.days), budget_tier: quizAnswers.budget || 'mid', travel_mode: quizAnswers.travelMode || 'any', traveler_type: quizAnswers.travelerType || 'solo', departure_city: quizAnswers.departureCity || '', personality: personality?.type || 'Traveller' }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const data: GeneratedItinerary = await res.json();
      setItinerary(data);
    } catch (err) {
      setError('Could not generate itinerary. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <Frown className="w-8 h-8 text-red-400" />
      </div>
        <h2 className="font-display text-2xl font-bold mb-2">Something went wrong</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <button className="btn-primary" onClick={() => { setError(null); if (selectedDest) generateItinerary(selectedDest.name); }}>Try Again</button>
      </div>
    );
  }

  if (isGenerating) return <LoadingState />;
  if (itinerary)    return <ItineraryView itinerary={itinerary} />;
  // If destination pre-set, show loading while auto-generation kicks in
  if (quizAnswers.destination) return <LoadingState message={`Building your ${quizAnswers.destination} itinerary…`} />;
  if (loadingDestinations || destinations.length === 0) return <LoadingState message="Finding your perfect destinations…" />;
  return <DestinationCards destinations={destinations} onSelect={dest => selectDest(dest)} />;
}