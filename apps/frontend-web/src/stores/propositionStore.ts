import { create } from 'zustand';
import type { Proposition, PropositionStoreExtended } from '@/types/proposition.types';

function persistMyPropositionsToLocalStorage(propositions: Proposition[]) {
  try {
    localStorage.setItem('tsa_my_propositions', JSON.stringify(propositions));
  } catch (error) {
    console.error('Failed to persist my propositions to localStorage:', error);
  }
}

function loadMyPropositionsFromLocalStorage(): Proposition[] {
  try {
    const raw = localStorage.getItem('tsa_my_propositions');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (error) {
    console.error('Failed to load my propositions from localStorage:', error);
  }
  return [];
}

export const usePropositionStore = create<PropositionStoreExtended>((set, get) => ({
  // State
  myPropositions: loadMyPropositionsFromLocalStorage(),
  isLoading: false,
  error: null,

  // Basic actions
  setMyPropositions: (propositions: Proposition[]) => {
    persistMyPropositionsToLocalStorage(propositions);
    set({ myPropositions: propositions });
  },

  addProposition: (proposition: Proposition) => {
    const propositions = get().myPropositions;
    const updatedPropositions = [...propositions, proposition];
    persistMyPropositionsToLocalStorage(updatedPropositions);
    set({ myPropositions: updatedPropositions });
  },

  updateProposition: (id: string, update: Proposition) => {
    const propositions = get().myPropositions;
    const updatedPropositions = propositions.map((proposition) =>
      proposition.id === id ? { ...proposition, ...update } : proposition
    );
    persistMyPropositionsToLocalStorage(updatedPropositions);
    set({ myPropositions: updatedPropositions });
  },

  deleteProposition: (id: string) => {
    const propositions = get().myPropositions;
    const updatedPropositions = propositions.filter((proposition) => proposition.id !== id);
    persistMyPropositionsToLocalStorage(updatedPropositions);
    set({ myPropositions: updatedPropositions });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
