// ── Quiz & Personality ─────────────────────────────────────────────────────

export type TripPurpose = 'spiritual' | 'honeymoon' | 'adventure' | 'weekend_escape';
export type BudgetTier  = 'budget' | 'mid' | 'premium';
export type TravelMode  = 'train' | 'road' | 'flight' | 'any';
export type TravelerType = 'solo' | 'couple' | 'group' | 'family';
export type DayRange    = '1-3' | '4-7' | '8-14' | '15+';

export interface QuizAnswers {
  purpose:       TripPurpose;
  days:          DayRange;
  budget:        BudgetTier;
  departureCity: string;
  travelMode:    TravelMode;
  travelerType:  TravelerType;
  destination?:  string; // Mode B — user picks their own destination
}

export interface PersonalityCard {
  type:        string;  // e.g. "Budget Solo Adventurer"
  tagline:     string;
  emoji:       string;
  description: string;
  traits:      string[];
  color:       string;  // hex
}

// ── Itinerary ──────────────────────────────────────────────────────────────

export interface TimeSlot {
  activity:         string;
  location:         string;
  duration_minutes: number;
  why_it_fits:      string;
  best_time:        string; // "Early morning" | "Daytime" | "Sunset" | "Night"
  distance_km:      number;
}

export interface HiddenGem {
  name:        string;
  description: string;
  distance_km: number;
  best_time:   string;
  lat?:        number;
  lng?:        number;
  unsplash_id?: string;
}

export interface FoodSuggestion {
  name:        string;
  cuisine:     string;
  price_range: string;
}

export interface ItineraryDay {
  day:        number;
  title:      string;
  morning:    TimeSlot;
  afternoon:  TimeSlot;
  evening:    TimeSlot;
  hidden_gem: HiddenGem;
  food:       FoodSuggestion;
  estimated_cost_inr: number;
}

export interface BudgetBreakdown {
  transport:   number;
  stay:        number;
  food:        number;
  activities:  number;
  buffer:      number;
  total:       number;
  is_over_budget: boolean;
  stated_budget_inr: number;
}

export interface Waypoint {
  day:   number;
  name:  string;
  lat:   number;
  lng:   number;
  is_gem?: boolean;
}

export interface GeneratedItinerary {
  personality:   string;
  destination:   string;
  days:          ItineraryDay[];
  budget:        BudgetBreakdown;
  waypoints:     Waypoint[];
  weather_note?: string;
  safety_note?:  string;
  feasibility_warning?: string; // Added field to handle logic check warnings
}

// ── Destination Discovery ──────────────────────────────────────────────────

export interface DestinationCard {
  id:          string;
  name:        string;
  state:       string;
  match_pct:   number;
  purpose_tags: TripPurpose[];
  crowd_level: 'Low' | 'Medium' | 'High';
  weather_summary: string;
  avg_daily_cost:  number;
  estimated_total: number;
  lat:         number;
  lng:         number;
  unsplash_query: string;
  photo_url?:  string;
}

// ── Saved Itinerary (Supabase row) ─────────────────────────────────────────

export interface SavedItinerary {
  id:             string;
  user_id?:       string;
  created_at:     string;
  destination:    string;
  purpose:        TripPurpose;
  days:           number;
  budget_tier:    BudgetTier;
  travel_mode:    TravelMode;
  traveler_type:  TravelerType;
  departure_city: string;
  itinerary_data: GeneratedItinerary;
  budget_data:    BudgetBreakdown;
  rating?:        1 | -1;
  is_public:      boolean;
  share_token:    string;
}

// ── API Request/Response ───────────────────────────────────────────────────

export interface GenerateItineraryRequest {
  destination:   string;
  purpose:       TripPurpose;
  days:          number;
  budget_tier:   BudgetTier;
  travel_mode:   TravelMode;
  traveler_type: TravelerType;
  departure_city: string;
  personality:   string;
}

export interface RegenerateSlotRequest {
  itinerary_id: string;
  day_index:    number;
  slot:         'morning' | 'afternoon' | 'evening';
  destination:  string;
  purpose:      TripPurpose;
  context:      string;
}