import { useAuth } from './useAuth';
import { missionService } from '@/services/mission.service';
import type { Paginator } from '@/types/common.types';
import { useCallback, useEffect } from 'react';
import type { Proposition } from '@/types/proposition.types';
import { usePropositionStore } from '@/stores/propositionStore';

export function usePropositions() {
  const { isAuthenticated, user } = useAuth();

  const myPropositions = usePropositionStore((s) => s.myPropositions);
  const isLoading = usePropositionStore((s) => s.isLoading);
  const error = usePropositionStore((s) => s.error);
  const setMyPropositions = usePropositionStore((s) => s.setMyPropositions);
  const addProposition = usePropositionStore((s) => s.addProposition);
  const updateProposition = usePropositionStore((s) => s.updateProposition);
  const deleteProposition = usePropositionStore((s) => s.deleteProposition);
  const setLoading = usePropositionStore((s) => s.setLoading);
  const setError = usePropositionStore((s) => s.setError);

  const handleGetMyPropositions = useCallback(async () => {
    let page: number = 1;
    let myNext: boolean = true;
    let myPropositionsList: Paginator<Proposition> = {
      data: [],
      meta: {
        total: 0,
        perPage: 20,
        currentPage: 1,
        lastPage: 1,
        firstPage: 1,
        firstPageUrl: null,
        lastPageUrl: null,
        nextPageUrl: null,
        previousPageUrl: null,
      },
    };

    while (myNext) {
      try {
        const response = await missionService.getMyPropositions({ page });

        if (response.error) {
          console.error('API error:', response.error);
          myNext = false;
          break;
        }

        if (response.data) {
          if (page === 1) {
            myPropositionsList = response.data;
          } else {
            myPropositionsList = {
              data: [...myPropositionsList.data, ...response.data.data],
              meta: response.data.meta,
            };
          }

          setMyPropositions(myPropositionsList.data);
          myNext = response.data.meta.nextPageUrl !== null || false;
          if (myNext) page += 1;
        }
      } catch (error) {
        console.error(error);
      }
    }
  }, [setMyPropositions]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'transporteur') {
      handleGetMyPropositions();
    }
  }, [handleGetMyPropositions, isAuthenticated, user?.role]);

  return {
    // State
    myPropositions,
    isLoading,
    error,

    // Actions
    setMyPropositions,
    addProposition,
    updateProposition,
    deleteProposition,
    setLoading,
    setError,
  };
}
