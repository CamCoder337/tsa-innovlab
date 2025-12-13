import { useState, useEffect, useCallback } from 'react';
import { emergencyService, type EmergencyStats } from '@/services/emergency.service';
import { webSocketService } from '@/services/websocket.service';

/**
 * Hook pour récupérer les statistiques d'urgence en temps réel
 * Utilisé pour afficher le badge dans la sidebar
 */
export function useEmergencyStats() {
  const [stats, setStats] = useState<EmergencyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const result = await emergencyService.getEmergencyStats();
      if (result.data) {
        setStats(result.data);
        setError(null);
      } else if (result.error) {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Failed to fetch emergency stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Polling toutes les 30 secondes
    const interval = setInterval(fetchStats, 30000);

    // Écouter les événements WebSocket SOS
    const unsubAlert = webSocketService.subscribe('sos:alert', () => {
      fetchStats();
    });
    const unsubResolved = webSocketService.subscribe('sos:resolved', () => {
      fetchStats();
    });
    const unsubAck = webSocketService.subscribe('sos:acknowledged', () => {
      fetchStats();
    });

    return () => {
      clearInterval(interval);
      unsubAlert();
      unsubResolved();
      unsubAck();
    };
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
    activeCount: stats?.active || 0,
    hasCritical: (stats?.critical || 0) > 0,
  };
}

export default useEmergencyStats;
