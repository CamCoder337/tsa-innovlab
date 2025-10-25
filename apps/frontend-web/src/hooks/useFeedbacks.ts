import { useMissionStore } from '@/stores/missionStore';

/**
 * Hook for feedback management operations
 */
export const useFeedbacks = () => {
  const {
    feedbacks,
    currentFeedback,
    feedbackStats,
    isLoading,
    error,
    fetchFeedbacks,
    fetchFeedback,
    fetchFeedbackStats,
    setCurrentFeedback,
    setFeedbacks,
    setFeedbackStats,
    clearError,
  } = useMissionStore();

  return {
    // State
    feedbacks,
    currentFeedback,
    feedbackStats,
    isLoading,
    error,

    // Actions
    fetchFeedbacks,
    fetchFeedback,
    fetchFeedbackStats,
    setCurrentFeedback,
    setFeedbacks,
    setFeedbackStats,
    clearError,

    // Utility methods
    getFeedbacksByRating: (rating: number) =>
      feedbacks.filter((feedback) => feedback.rating === rating),

    getFeedbacksByTransporteur: (transporteurId: string) =>
      feedbacks.filter((feedback) => feedback.transporteurId === transporteurId),

    getAverageRating: () => {
      if (feedbacks.length === 0) return 0;
      const total = feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0);
      return Math.round((total / feedbacks.length) * 100) / 100;
    },

    getRatingDistribution: () => {
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      feedbacks.forEach((feedback) => {
        distribution[feedback.rating as keyof typeof distribution]++;
      });
      return distribution;
    },
  };
};
