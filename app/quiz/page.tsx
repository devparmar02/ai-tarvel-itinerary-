'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Share2, MapPin, Flame, Heart, Mountain, Zap, Clock, Calendar, Globe, Backpack, Banknote, Wallet, CreditCard, Sparkles, Train, Car, Plane, Map, User, Users, UsersRound, Baby } from 'lucide-react';
import { useTravelStore } from '@/lib/store';
import { getPersonality } from '@/lib/personality';
import type { QuizAnswers } from '@/types';

// ── All 6 steps ───────────────────────────────────────────────────────────
const ALL_STEPS = [
  {
    key: 'purpose',
    question: 'What is the purpose of this trip?',
    subtitle: 'This shapes every recommendation we make for you.',
    type: 'options' as const,
    options: [
      { value: 'spiritual',      label: 'Spiritual',      icon: <Flame className="w-5 h-5" />,     desc: 'Temples, peace, sacred experiences' },
      { value: 'honeymoon',      label: 'Honeymoon',      icon: <Heart className="w-5 h-5" />,     desc: 'Romantic, intimate, special moments' },
      { value: 'adventure',      label: 'Adventure',      icon: <Mountain className="w-5 h-5" />,  desc: 'Treks, rivers, thrill, outdoors' },
      { value: 'weekend_escape', label: 'Weekend Escape', icon: <Zap className="w-5 h-5" />,       desc: 'Rest, reset, quick getaway' },
    ],
  },
  {
    key: 'days',
    question: 'How many days do you have?',
    subtitle: "We'll build the right pace for your schedule.",
    type: 'options' as const,
    options: [
      { value: '1-3',  label: '1–3 Days',  icon: <Clock className="w-5 h-5" />,    desc: 'Short & sweet' },
      { value: '4-7',  label: '4–7 Days',  icon: <Calendar className="w-5 h-5" />, desc: 'A proper escape' },
      { value: '8-14', label: '8–14 Days', icon: <Globe className="w-5 h-5" />,    desc: 'Deep exploration' },
      { value: '15+',  label: '15+ Days',  icon: <Backpack className="w-5 h-5" />, desc: 'Long journey' },
    ],
  },
  {
    key: 'budget',
    question: 'What is your budget per person?',
    subtitle: 'This sets stay, food, and activity tiers — all in INR.',
    type: 'options' as const,
    options: [
      { value: 'budget',  label: 'Under ₹5K',   icon: <Banknote className="w-5 h-5" />,  desc: '~₹1,200/day — hostels, dhabas, local buses' },
      { value: 'mid',     label: '₹5K – ₹15K',  icon: <Wallet className="w-5 h-5" />,    desc: '~₹3,000/day — guesthouses, mid restaurants' },
      { value: 'upper',   label: '₹15K – ₹40K', icon: <CreditCard className="w-5 h-5" />,desc: '~₹5,000/day — comfortable hotels, good food' },
      { value: 'premium', label: '₹40K+',        icon: <Sparkles className="w-5 h-5" />,  desc: '~₹7,000/day — boutique stays, fine dining' },
    ],
  },
  {
    key: 'departureCity',
    question: 'Where are you starting from?',
    subtitle: 'Helps us calculate travel time and suggest realistic routes.',
    type: 'text' as const,
  },
  {
    key: 'travelMode',
    question: 'How do you prefer to travel?',
    subtitle: "We'll factor in routes, comfort, and cost accordingly.",
    type: 'options' as const,
    options: [
      { value: 'train',  label: 'By Train',  icon: <Train className="w-5 h-5" />, desc: 'Comfortable, scenic, budget-friendly' },
      { value: 'road',   label: 'By Road',   icon: <Car className="w-5 h-5" />,   desc: 'Flexible, explore en route' },
      { value: 'flight', label: 'By Flight', icon: <Plane className="w-5 h-5" />, desc: 'Fast, good for longer distances' },
      { value: 'any',    label: 'Any Mode',  icon: <Map className="w-5 h-5" />,   desc: 'Show me the best option' },
    ],
  },
  {
    key: 'travelerType',
    question: 'What kind of traveller are you?',
    subtitle: "We'll tailor stays and activities to your group.",
    type: 'options' as const,
    options: [
      { value: 'solo',   label: 'Solo',        icon: <User className="w-5 h-5" />,       desc: 'Just me — freedom first' },
      { value: 'couple', label: 'Couple',       icon: <Heart className="w-5 h-5" />,      desc: 'Two of us' },
      { value: 'group',  label: 'Small Group',  icon: <UsersRound className="w-5 h-5" />, desc: '3–8 friends' },
      { value: 'family', label: 'Family',       icon: <Users className="w-5 h-5" />,      desc: 'With kids or elders' },
    ],
  },
];

// When destination is already chosen (from home page or packages),
// only ask: days, budget, departureCity, travelMode
const SHORT_STEPS_KEYS = ['days', 'budget', 'departureCity', 'travelMode'];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

export default function QuizPage() {
  const router = useRouter();
  const { quizAnswers, setQuizAnswer, setPersonality } = useTravelStore();

  // If destination already set (from home page), use short steps
  const hasDestination = !!quizAnswers.destination;
  const STEPS = hasDestination
    ? ALL_STEPS.filter(s => SHORT_STEPS_KEYS.includes(s.key))
    : ALL_STEPS;

  const [step, setStep]         = useState(0);
  const [dir,  setDir]          = useState(1);
  const [text, setText]         = useState(quizAnswers.departureCity || '');
  const [showCard, setShowCard] = useState(false);
  const [selected, setSelected] = useState<string>('');
  const [sharing, setSharing]   = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const currentStep = STEPS[step];
  const progress    = ((step + 1) / STEPS.length) * 100;
  const isLast      = step === STEPS.length - 1;

  async function handleShareCard() {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = 'my-travel-personality.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Share card error:', err);
    } finally {
      setSharing(false);
    }
  }

  function handleOption(value: string, label: string) {
    setSelected(`${value}::${label}`);
    setQuizAnswer(currentStep.key as keyof QuizAnswers, value as never);
  }

  function handleNext() {
    if (currentStep.type === 'text') {
      if (!text.trim()) return;
      setQuizAnswer('departureCity', text.trim() as never);
    }
    if (isLast) {
      // If destination already set, skip personality card — go straight to itinerary
      if (hasDestination) {
        // Set a default purpose if not set (for short quiz path)
        if (!quizAnswers.purpose) setQuizAnswer('purpose', 'weekend_escape' as never);
        router.push('/itinerary');
      } else {
        const card = getPersonality(quizAnswers);
        setPersonality(card);
        setShowCard(true);
      }
    } else {
      setDir(1);
      setStep(s => s + 1);
      setSelected('');
    }
  }

  function handleBack() {
    if (step === 0) router.push('/');
    else { setDir(-1); setStep(s => s - 1); setSelected(''); }
  }

  function handleContinue() {
    router.push('/itinerary');
  }

  const card = showCard ? getPersonality(quizAnswers) : null;
  const canProceed = currentStep.type === 'text'
    ? text.trim().length > 0
    : !!selected || !!quizAnswers[currentStep.key as keyof QuizAnswers];

  // ── Personality card screen ───────────────────────────────────────────
  if (showCard && card) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-12">
        <motion.div className="max-w-md w-full"
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.4 }}>
          <div ref={cardRef}
            className="rounded-2xl p-8 text-white text-center mb-6 relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${card.color}dd, ${card.color}99)` }}>
            <div className="absolute inset-0 opacity-10 noise-texture" />
            <div className="relative">
              <div className="text-6xl mb-4">{card.emoji}</div>
              <p className="text-white/70 text-sm uppercase tracking-widest mb-2">Your Travel Personality</p>
              <h2 className="font-display text-3xl font-bold mb-2">{card.type}</h2>
              <p className="text-white/80 italic text-sm mb-4">&ldquo;{card.tagline}&rdquo;</p>
              <p className="text-white/90 text-sm leading-relaxed mb-5">{card.description}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {card.traits.map(t => (
                  <span key={t} className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mb-4">
            <button
              className="flex-1 flex items-center justify-center gap-2 border-2 border-forest text-forest font-semibold py-3 rounded-btn hover:bg-forest/5 transition-colors disabled:opacity-60"
              onClick={handleShareCard} disabled={sharing}>
              <Share2 className="w-4 h-4" /> {sharing ? 'Saving…' : 'Share Card'}
            </button>
            <button className="flex-1 btn-primary flex items-center justify-center gap-2" onClick={handleContinue}>
              Find Destinations <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-center text-xs text-gray-400">Your personality shapes every destination and activity we suggest.</p>
        </motion.div>
      </div>
    );
  }

  // ── Quiz screen ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-sm">
        <div className="max-w-xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <button onClick={handleBack} className="text-gray-400 hover:text-forest transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              {hasDestination && (
                <p className="text-xs text-forest font-semibold mb-0.5 flex items-center justify-center gap-1">
                  <MapPin className="w-3 h-3" /> {quizAnswers.destination}
                </p>
              )}
              <span className="text-xs font-semibold text-gray-400">
                Question {step + 1} of {STEPS.length}
              </span>
            </div>
            <div className="w-5" />
          </div>
          <div className="h-1.5 bg-sand rounded-full overflow-hidden">
            <motion.div className="h-full bg-forest rounded-full"
              animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>
      </div>

      {/* Quiz content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-10">
        <div className="max-w-xl w-full">
          {hasDestination && step === 0 && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-forest/5 border border-forest/20 rounded-xl px-4 py-3 text-sm text-forest font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              Destination set: <strong>{quizAnswers.destination}</strong> — just answer {STEPS.length} quick questions.
            </motion.div>
          )}

          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={step} custom={dir} variants={slideVariants}
              initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <div className="mb-8">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-2">
                  {currentStep.question}
                </h1>
                {currentStep.subtitle && (
                  <p className="text-gray-500 text-sm">{currentStep.subtitle}</p>
                )}
              </div>

              {currentStep.type === 'options' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentStep.options?.map(opt => {
                    const optKey = `${opt.value}::${opt.label}`;
                    const isSelected = selected === optKey ||
                      (!selected && quizAnswers[currentStep.key as keyof QuizAnswers] === opt.value &&
                        !currentStep.options?.some(o => o.value === opt.value && o.label !== opt.label));
                    return (
                      <button key={opt.value + opt.label}
                        className={isSelected ? 'quiz-option-selected' : 'quiz-option'}
                        onClick={() => handleOption(opt.value, opt.label)}>
                        <div className="flex items-start gap-3">
                          <span className={`flex-shrink-0 mt-0.5 ${isSelected ? 'text-forest' : 'text-gray-500'}`}>{opt.icon}</span>
                          <div>
                            <div className="font-semibold text-sm">{opt.label}</div>
                            {opt.desc && <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentStep.type === 'text' && (
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" className="input-field pl-10 text-base"
                    placeholder="e.g. Mumbai, Delhi, Bangalore..."
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && canProceed && handleNext()}
                    maxLength={100} autoFocus />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8">
            <button
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleNext} disabled={!canProceed}>
              {isLast ? (hasDestination ? 'Build My Itinerary' : 'See My Personality') : 'Continue'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}