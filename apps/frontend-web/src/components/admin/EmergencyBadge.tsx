import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { emergencyService, type EmergencyStats } from '@/services/emergency.service';
import { useWebSocket } from '@/hooks/useWebSocket';

interface EmergencyBadgeProps {
  className?: string;
  showLabel?: boolean;
}

/**
 * Badge d'urgence pour la sidebar admin
 * Affiche le nombre d'urgences actives et pulse si > 0
 */
export function EmergencyBadge({ className = '', showLabel = true }: EmergencyBadgeProps) {
  const [stats, setStats] = useState<EmergencyStats | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const result = await emergencyService.getEmergencyStats();
      if (result.data) {
        // Déclencher l'animation si le nombre augmente
        if (stats && result.data.active > stats.active) {
          setIsAnimating(true);
          // Jouer un son d'alerte
          playAlertSound();
          setTimeout(() => setIsAnimating(false), 2000);
        }
        setStats(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch emergency stats:', error);
    }
  }, [stats]);

  // Polling toutes les 30 secondes
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Écouter les événements WebSocket SOS
  useWebSocket({
    onMessage: (event) => {
      if (event.type === 'sos:alert') {
        // Nouvelle urgence reçue
        setIsAnimating(true);
        playAlertSound();
        fetchStats();
        setTimeout(() => setIsAnimating(false), 2000);
      } else if (event.type === 'sos:resolved') {
        // Urgence résolue
        fetchStats();
      }
    },
  });

  const playAlertSound = () => {
    try {
      // Créer un son d'alerte simple avec Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      
      // Beep pattern
      setTimeout(() => {
        oscillator.frequency.value = 600;
      }, 150);
      setTimeout(() => {
        oscillator.frequency.value = 800;
      }, 300);
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 450);
    } catch (error) {
      console.warn('Could not play alert sound:', error);
    }
  };

  if (!stats || stats.active === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`
          relative flex items-center gap-2 px-3 py-1.5 rounded-full
          bg-red-100 text-red-700 font-medium
          ${isAnimating ? 'animate-pulse' : ''}
        `}
      >
        <AlertTriangle className="h-4 w-4" />
        {showLabel && <span>SOS</span>}
        <Badge
          variant="destructive"
          className={`
            ${stats.critical > 0 ? 'bg-red-600' : 'bg-orange-500'}
            ${isAnimating ? 'animate-bounce' : ''}
          `}
        >
          {stats.active}
        </Badge>
        
        {/* Indicateur de pulsation */}
        {stats.critical > 0 && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </div>
    </div>
  );
}

export default EmergencyBadge;
