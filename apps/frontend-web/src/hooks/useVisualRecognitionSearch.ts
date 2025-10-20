import { useState, useCallback } from 'react';
import { shopService } from '@/services/shop.service';
import type { Product } from '@/types/product.types';

interface VisualRecognitionResult {
  products: Product[];
  processing_time_ms: number;
  total: number;
}

interface UseVisualRecognitionSearchReturn {
  results: VisualRecognitionResult | null;
  isLoading: boolean;
  error: string | null;
  searchByImage: (image: File) => Promise<void>;
  clearResults: () => void;
}

export const useVisualRecognitionSearch = (): UseVisualRecognitionSearchReturn => {
  const [results, setResults] = useState<VisualRecognitionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchByImage = useCallback(async (image: File) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await shopService.visualRecognitionSearch(image);

      if (response.error) {
        throw new Error(response.error.message || 'Failed to perform visual recognition search');
      }

      if (response.data) {
        setResults(response.data);
      }
    } catch (err) {
      console.error('Visual recognition search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to perform visual search');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults(null);
    setError(null);
  }, []);

  return {
    results,
    isLoading,
    error,
    searchByImage,
    clearResults,
  };
};
