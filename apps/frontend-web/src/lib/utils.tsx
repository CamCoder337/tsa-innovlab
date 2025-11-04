import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

export function getTimeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Il y a moins d'une heure";
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  return past.toLocaleDateString('fr-FR');
}
