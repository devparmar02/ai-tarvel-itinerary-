import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QuizAnswers, PersonalityCard, GeneratedItinerary, DestinationCard } from '@/types';

export interface SavedTrip {
  id:          string;
  destination: string;
  days:        number;
  purpose:     string;
  itinerary:   GeneratedItinerary;
  quizAnswers: Partial<QuizAnswers>;
  savedAt:     number;
}

interface TravelStore {
  // Quiz
  quizStep:    number;
  quizAnswers: Partial<QuizAnswers>;
  personality: PersonalityCard | null;

  // Destination discovery
  destinations: DestinationCard[];
  selectedDest: DestinationCard | null;

  // Itinerary
  itinerary:    GeneratedItinerary | null;
  savedId:      string | null;
  shareToken:   string | null;
  isGenerating: boolean;
  activeDay:    number;
  showMap:      boolean;
  showBudget:   boolean;

  // Persisted recent trips (stored in localStorage)
  recentTrips: SavedTrip[];

  // Actions
  setQuizStep:     (step: number) => void;
  setQuizAnswer:   <K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K]) => void;
  setPersonality:  (p: PersonalityCard) => void;
  setDestinations: (d: DestinationCard[]) => void;
  selectDest:      (d: DestinationCard) => void;
  setItinerary:    (i: GeneratedItinerary) => void;
  setSavedId:      (id: string, token: string) => void;
  setGenerating:   (v: boolean) => void;
  setActiveDay:    (day: number) => void;
  toggleMap:       () => void;
  toggleBudget:    () => void;
  resetQuiz:       () => void;
  saveRecentTrip:  (trip: SavedTrip) => void;
  loadRecentTrip:  (trip: SavedTrip) => void;
  deleteRecentTrip:(id: string) => void;
}

export const useTravelStore = create<TravelStore>()(
  persist(
    (set, get) => ({
      quizStep:     0,
      quizAnswers:  {},
      personality:  null,
      destinations: [],
      selectedDest: null,
      itinerary:    null,
      savedId:      null,
      shareToken:   null,
      isGenerating: false,
      activeDay:    0,
      showMap:      false,
      showBudget:   false,
      recentTrips:  [],

      setQuizStep:     (step)        => set({ quizStep: step }),
      setQuizAnswer:   (key, value)  => set(s => ({ quizAnswers: { ...s.quizAnswers, [key]: value } })),
      setPersonality:  (personality) => set({ personality }),
      setDestinations: (destinations)=> set({ destinations }),
      selectDest:      (selectedDest)=> set({ selectedDest }),
      setSavedId:      (savedId, shareToken) => set({ savedId, shareToken }),
      setGenerating:   (isGenerating)=> set({ isGenerating }),
      setActiveDay:    (activeDay)   => set({ activeDay }),
      toggleMap:       ()            => set(s => ({ showMap: !s.showMap })),
      toggleBudget:    ()            => set(s => ({ showBudget: !s.showBudget })),

      setItinerary: (itinerary) => {
        set({ itinerary, isGenerating: false, activeDay: 0 });
        // Auto-save to recent trips
        const { quizAnswers, recentTrips } = get();
        const trip: SavedTrip = {
          id:          `trip-${Date.now()}`,
          destination: itinerary.destination,
          days:        itinerary.days.length,
          purpose:     quizAnswers.purpose || 'weekend_escape',
          itinerary,
          quizAnswers,
          savedAt:     Date.now(),
        };
        const deduped = recentTrips.filter(t => t.destination !== itinerary.destination);
        set({ recentTrips: [trip, ...deduped].slice(0, 6) });
      },

      saveRecentTrip: (trip) => set(s => ({
        recentTrips: [trip, ...s.recentTrips.filter(t => t.id !== trip.id)].slice(0, 6),
      })),

      // Load a past trip directly — no quiz needed
      loadRecentTrip: (trip) => set({
        itinerary:    trip.itinerary,
        quizAnswers:  trip.quizAnswers,
        activeDay:    0,
        showMap:      false,
        showBudget:   false,
        isGenerating: false,
        savedId:      null,
        shareToken:   null,
      }),

      deleteRecentTrip: (id) => set(s => ({
        recentTrips: s.recentTrips.filter(t => t.id !== id),
      })),

      resetQuiz: () => set({
        quizStep: 0, quizAnswers: {}, personality: null,
        destinations: [], selectedDest: null, itinerary: null,
      }),
    }),
    {
      name:    'tripmind-store',
      // Only persist recentTrips + quizAnswers — not transient UI state
      partialize: (s) => ({
        recentTrips: s.recentTrips,
        quizAnswers: s.quizAnswers,
        personality: s.personality,
      }),
    }
  )
);