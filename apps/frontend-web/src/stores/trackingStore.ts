import { create } from 'zustand';
import type { TrackingStore, ShipmentDetails } from '@/types/tracking.types';

// Helper functions for localStorage persistence
const persistTrackingToLocalStorage = (tracking: ShipmentDetails | null) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('currentTracking', JSON.stringify(tracking));
  }
};

const loadTrackingFromLocalStorage = (): ShipmentDetails | null => {
  if (typeof window === 'undefined') return null;

  try {
    const saved = localStorage.getItem('currentTracking');
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Error loading tracking from localStorage:', error);
    return null;
  }
};

export const useTrackingStore = create<TrackingStore>((set) => ({
  // Initial state
  currentTracking: loadTrackingFromLocalStorage(),
  isLoading: false,
  error: null,
  lastUpdated: null,

  // Actions
  setCurrentTracking: (tracking) => {
    persistTrackingToLocalStorage(tracking);
    set({
      currentTracking: tracking,
      lastUpdated: new Date().toISOString(),
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  setLastUpdated: (date) => set({ lastUpdated: date }),

  clearTracking: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentTracking');
    }
    set({
      currentTracking: null,
      lastUpdated: new Date().toISOString(),
    });
  },
}));
