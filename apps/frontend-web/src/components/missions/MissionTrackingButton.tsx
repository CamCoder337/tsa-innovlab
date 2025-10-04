import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MissionTrackingButtonProps {
  missionId: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export default function MissionTrackingButton({
  missionId,
  size = 'sm',
  variant = 'outline',
  className = '',
  onClick,
}: MissionTrackingButtonProps) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    }
    navigate(`/app/mission/${missionId}/tracking`);
  };

  return (
    <Button size={size} variant={variant} className={className} onClick={handleClick}>
      <MapPin className="w-3 h-3 mr-1" />
      Suivre
    </Button>
  );
}
