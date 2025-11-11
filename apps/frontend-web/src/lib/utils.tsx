import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { MissionStatus } from '@/types/mission.types';
import type { OrderStatus, PaymentStatus } from '@/types/order.types';
import { CheckCircle, Clock, Package, XCircle } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M FCFA`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K FCFA`;
  }
  return `${amount.toLocaleString('fr-FR')} FCFA`;
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getStatusColor(status: MissionStatus | OrderStatus | PaymentStatus) {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    case 'published':
    case 'paid':
      return 'bg-blue-100 text-blue-800';
    case 'assigned':
    case 'processing':
      return 'bg-purple-100 text-purple-800';
    case 'in_progress':
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'completed':
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'shipped':
      return 'bg-indigo-500';
    case 'refunded':
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
    case 'published':
    case 'pending':
      return <Clock className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
}

// Utility function that accepts a translation function
export function getStatusLabel(
  status: MissionStatus | OrderStatus | PaymentStatus,
  t?: (key: string, options?: Record<string, unknown>) => string
) {
  if (t) {
    const translated = t(`status.${status}`);
    // Only return translated if it's not the same as the key (meaning translation was found)
    if (translated && translated !== `status.${status}`) {
      return translated.toUpperCase();
    }
  }

  // Fallback to French labels if no translation function provided or translation not found
  const labels = {
    draft: 'BROUILLON',
    published: 'OUVERTE',
    pending: 'EN ATTENTE',
    accepted: 'ACCEPTÉE',
    assigned: 'ASSIGNÉE',
    in_progress: 'EN COURS',
    completed: 'TERMINÉE',
    rejected: 'REJETÉE',
    paid: 'PAYÉE',
    processing: 'EN TRAITEMENT',
    shipped: 'EXPÉDIÉE',
    delivered: 'LIVRÉE',
    refunded: 'REMBOURSÉE',
    cancelled: 'ANNULÉE',
  };
  return labels[status as keyof typeof labels] || status.toUpperCase();
}

export function getTimeAgo(
  date: string,
  t?: (key: string, options?: Record<string, unknown>) => string
): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (t) {
    if (diffHours < 1) return t('time.lessThanHour');
    if (diffHours < 24) return t('time.hoursAgo', { hours: diffHours });
    if (diffDays < 7) return t('time.daysAgo', { days: diffDays, plural: diffDays > 1 ? 's' : '' });
    return past.toLocaleDateString();
  }

  // Fallback to French if no translation function
  if (diffHours < 1) return "Il y a moins d'une heure";
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  return past.toLocaleDateString('fr-FR');
}
