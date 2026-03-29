import type { QuizAnswers, PersonalityCard, TripPurpose, BudgetTier, TravelerType } from '@/types';

type PersonalityKey = `${TripPurpose}_${BudgetTier}_${TravelerType}` | `${TripPurpose}_${BudgetTier}` | `${TripPurpose}_${TravelerType}` | TripPurpose;

const PERSONALITIES: Record<string, PersonalityCard> = {
  // Spiritual
  'spiritual_budget_solo':    { type: 'The Mindful Wanderer',     emoji: '🧘', tagline: 'Seeking stillness on a shoestring',           description: 'You travel light in baggage and in mind. Sacred spaces, gentle trails, and honest dhabas are your sanctuary.',                                                        traits: ['Introspective', 'Frugal', 'Spiritual'],          color: '#6B7FD4' },
  'spiritual_mid_couple':     { type: 'The Devotion Duo',          emoji: '🕌', tagline: 'Two souls, one sacred journey',               description: 'You seek blessings together — quiet temples at dawn, riverside prayers, and moments that words cannot hold.',                                                    traits: ['Connected', 'Devout', 'Peaceful'],                color: '#8B6FD4' },
  'spiritual_premium_family': { type: 'The Pilgrimage Keeper',    emoji: '🙏', tagline: 'Carrying faith across generations',            description: 'For you, travel is tradition. You arrange the journey, lead the prayers, and keep the family stories alive.',                                                    traits: ['Devoted', 'Organized', 'Legacy-driven'],          color: '#7A5FC0' },
  'spiritual':                { type: 'The Sacred Seeker',         emoji: '✨', tagline: 'Where every road leads inward',               description: 'Purpose over comfort. Meaning over luxury. You travel to arrive at something deeper than a destination.',                                                        traits: ['Spiritual', 'Reflective', 'Present'],             color: '#9B7FD4' },

  // Adventure
  'adventure_budget_solo':    { type: 'The Dirtbag Explorer',     emoji: '⛺', tagline: 'Maximum adventure, minimum spend',            description: 'A tent, a backpack, and a hand-drawn map. You measure trips in stories, not star ratings.',                                                                     traits: ['Bold', 'Resourceful', 'Free-spirited'],           color: '#E07B39' },
  'adventure_mid_group':      { type: 'The Crew Captain',          emoji: '🏔️', tagline: 'Leading the pack into the unknown',          description: 'You plan the route, split the bill, and remember everyone\'s allergies. Your trips become legends.',                                                           traits: ['Leader', 'Social', 'Adventurous'],                color: '#D4682A' },
  'adventure_premium_couple': { type: 'The Adrenaline Pair',      emoji: '🪂', tagline: 'Two risk-takers, one shared heartbeat',       description: 'Cliff jumps and canyon hikes by day, luxury camps by night. You don\'t compromise on either thrill or comfort.',                                               traits: ['Daring', 'Passionate', 'Refined'],                color: '#C05520' },
  'adventure':                { type: 'The Wild Heart',            emoji: '🌄', tagline: 'Born to roam, built to climb',               description: 'Waterfalls, ridge lines, village trails. You go where the path ends and the real adventure begins.',                                                           traits: ['Brave', 'Curious', 'Untamed'],                    color: '#E07B39' },

  // Honeymoon
  'honeymoon_budget_couple':  { type: 'The Romantic Escapists',   emoji: '💐', tagline: 'Love needs no price tag',                    description: 'A cliffside chai, a shared rickshaw, a surprise sunset. You know magic is found, not booked.',                                                                  traits: ['Romantic', 'Creative', 'Spontaneous'],            color: '#D4587A' },
  'honeymoon_mid_couple':     { type: 'The Golden Hour Lovers',   emoji: '🌅', tagline: 'Chasing the perfect light together',         description: 'You planned the mood board for months. Fairy lights, flower petals, and a balcony view — every detail matters.',                                               traits: ['Dreamy', 'Detail-oriented', 'Affectionate'],      color: '#C04060' },
  'honeymoon_premium_couple': { type: 'The Luxe Romantics',       emoji: '🥂', tagline: 'Because you both deserve the finest',        description: 'Infinity pools, butler service, and private candlelit dinners. This is the trip you\'ve been promising each other.',                                           traits: ['Indulgent', 'Intimate', 'Celebration-driven'],    color: '#A03050' },
  'honeymoon':                { type: 'The Devoted Pair',          emoji: '💑', tagline: 'Every destination is more beautiful with you', description: 'It\'s not about where you go — it\'s about experiencing it together for the very first time.',                                                            traits: ['Loving', 'Present', 'Grateful'],                  color: '#D4587A' },

  // Weekend Escape
  'weekend_escape_budget_solo':  { type: 'The Fast Escaper',         emoji: '🚂', tagline: '48 hours to reset everything',            description: 'One bag, last-minute train, and zero plans. You recharge by disappearing completely.',                                                                         traits: ['Impulsive', 'Independent', 'Recharging'],         color: '#2D9A6A' },
  'weekend_escape_mid_solo':     { type: 'The Intentional Drifter',  emoji: '☕', tagline: 'Rest is also a destination',              description: 'You book in advance, pack light, and arrive knowing nothing — that\'s the whole point.',                                                                      traits: ['Mindful', 'Solo', 'Deliberate'],                  color: '#2D8A5A' },
  'weekend_escape_budget_group': { type: 'The Chaos Crew',           emoji: '🎒', tagline: 'Nowhere to be, everywhere to go',         description: 'Seven people, three tents, one van. The plan always falls apart. The trip never does.',                                                                       traits: ['Fun', 'Chaotic', 'Loyal'],                        color: '#3DAA7A' },
  'weekend_escape':              { type: 'The Weekend Warrior',      emoji: '⚡', tagline: 'Recharge in 2 days flat',                 description: 'Monday looms. But right now: mountain air, silence, and absolutely no notifications.',                                                                       traits: ['Efficient', 'Decisive', 'Restorative'],           color: '#2D6A4F' },
};

export function getPersonality(answers: Partial<QuizAnswers>): PersonalityCard {
  const { purpose, budget, travelerType } = answers;
  if (!purpose) return PERSONALITIES['weekend_escape'];

  const keys = [
    `${purpose}_${budget}_${travelerType}`,
    `${purpose}_${budget}`,
    `${purpose}_${travelerType}`,
    purpose,
  ];

  for (const key of keys) {
    if (PERSONALITIES[key]) return PERSONALITIES[key];
  }
  return PERSONALITIES[purpose] || PERSONALITIES['weekend_escape'];
}

export function parseDaysNumber(range: string | undefined): number {
  if (!range) return 3;
  const map: Record<string, number> = { '1-3': 2, '4-7': 5, '8-14': 10, '15+': 14 };
  return map[range] ?? 3;
}

export function budgetTierToINR(tier: BudgetTier | undefined, days: number): number {
  const daily: Record<BudgetTier, number> = { budget: 1200, mid: 3000, premium: 7000 };
  return (daily[tier ?? 'mid'] ?? 3000) * days;
}