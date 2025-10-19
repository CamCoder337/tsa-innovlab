import type { MissionStatus } from '@/types/mission.types';
import { CheckCircle, Clock, Package, XCircle } from 'lucide-react';

export function getStatusColor(status: MissionStatus) {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    case 'published':
      return 'bg-blue-100 text-blue-800';
    case 'assigned':
      return 'bg-purple-100 text-purple-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
    case 'accepted':
      return <CheckCircle className="h-4 w-4" />;
    case 'cancelled':
    case 'rejected':
      return <XCircle className="h-4 w-4" />;
    case 'assigned':
    case 'published':
    case 'pending':
      return <Clock className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
}

export function getStatusLabel(status: MissionStatus) {
  const labels = {
    draft: 'BROUILLON',
    published: 'OUVERTE',
    pending: 'EN ATTENTE',
    accepted: 'ACCEPTÉE',
    assigned: 'ASSIGNÉE',
    completed: 'TERMINÉE',
    rejected: 'REJETÉE',
    cancelled: 'ANNULÉE',
  };
  return labels[status as keyof typeof labels] || status.toUpperCase();
}
