import type { Mission } from '@/types/mission.types';
import type { User } from '@/types/auth.types';
import { getStatusColor } from '@/lib/mission-utils';

export interface DashboardMetrics {
  activeMissions: number;
  completedMissions: number;
  totalRevenue: number;
  averageCost: number;
  successRate: number;
  growthRate: number;
}

export class DashboardUtils {
  static calculateMissionMetrics(missions: Mission[]): DashboardMetrics {
    const activeMissions = missions.filter((m) =>
      ['assigned', 'in_progress'].includes(m.status)
    ).length;

    const completedMissions = missions.filter((m) => m.status === 'completed').length;

    const totalRevenue = missions
      .filter((m) => m.status === 'completed')
      .reduce((sum, m) => sum + (m.budgetMin || 0), 0);

    const averageCost = completedMissions > 0 ? totalRevenue / completedMissions : 0;
    const successRate = missions.length > 0 ? (completedMissions / missions.length) * 100 : 0;

    // Calculate growth rate based on recent missions
    const now = new Date();
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const previousMonth = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const currentMonthMissions = missions.filter((m) => new Date(m.createdAt) >= lastMonth).length;

    const previousMonthMissions = missions.filter(
      (m) => new Date(m.createdAt) >= previousMonth && new Date(m.createdAt) < lastMonth
    ).length;

    const growthRate =
      previousMonthMissions > 0
        ? ((currentMonthMissions - previousMonthMissions) / previousMonthMissions) * 100
        : 0;

    return {
      activeMissions,
      completedMissions,
      totalRevenue,
      averageCost,
      successRate,
      growthRate,
    };
  }

  static calculateTimeBasedEarnings(missions: Mission[]) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const completedMissions = missions.filter((m) => m.status === 'completed');

    const todayEarnings = completedMissions
      .filter((m) => new Date(m.updatedAt) >= todayStart)
      .reduce((sum, m) => sum + (m.budgetMin || 0), 0);

    const weeklyEarnings = completedMissions
      .filter((m) => new Date(m.updatedAt) >= weekStart)
      .reduce((sum, m) => sum + (m.budgetMin || 0), 0);

    const monthlyEarnings = completedMissions
      .filter((m) => new Date(m.updatedAt) >= monthStart)
      .reduce((sum, m) => sum + (m.budgetMin || 0), 0);

    return {
      today: todayEarnings,
      week: weeklyEarnings,
      month: monthlyEarnings,
    };
  }

  static getRecentMissions(
    missions: Mission[],
    limit: number = 5,
    t: (key: string, options?: Record<string, unknown>) => string
  ) {
    return missions
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit)
      .map((mission) => ({
        ...mission,
        route: `${mission.adresseDepart?.city || 'N/A'} → ${mission.adresseArrivee?.city || 'N/A'}`,
        statusColor: getStatusColor(mission.status),
        statusLabel: mission.status,
        progress: this.calculateProgress(mission.status),
        timeAgo: this.getTimeAgo(mission.updatedAt, t),
        formattedBudget: this.formatCurrency(mission.budgetMin || 0),
      }));
  }

  static calculateProgress(status: string): number {
    const progress = {
      published: 0,
      assigned: 25,
      in_progress: 65,
      completed: 100,
      cancelled: 0,
    };
    return progress[status as keyof typeof progress] || 0;
  }

  static formatCurrency(amount: number): string {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M FCFA`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K FCFA`;
    }
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  }

  static formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  static getTimeAgo(
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
      if (diffDays < 7)
        return t('time.daysAgo', { days: diffDays, plural: diffDays > 1 ? 's' : '' });
      return past.toLocaleDateString();
    }

    // Fallback to French if no translation function
    if (diffHours < 1) return "Il y a moins d'une heure";
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    return past.toLocaleDateString('fr-FR');
  }

  static calculateGrowthPercentage(current: number, previous: number): string {
    if (previous === 0) return '+0%';
    const growth = ((current - previous) / previous) * 100;
    const sign = growth >= 0 ? '+' : '';
    return `${sign}${growth.toFixed(1)}%`;
  }

  static generateInsightRecommendations(missions: Mission[]) {
    const recommendations = [];

    // Cost optimization recommendation
    const routeFrequency = missions.reduce(
      (acc, mission) => {
        const route = `${mission.adresseDepart?.city}-${mission.adresseArrivee?.city}`;
        acc[route] = (acc[route] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const mostFrequentRoute = Object.entries(routeFrequency).sort(([, a], [, b]) => b - a)[0];

    if (mostFrequentRoute && mostFrequentRoute[1] > 2) {
      recommendations.push({
        type: 'cost_optimization',
        title: 'Optimisation Coûts',
        message: `Groupez vos missions ${mostFrequentRoute[0].replace('-', ' → ')} pour économiser 15%`,
        color: 'blue',
      });
    }

    // Performance recommendation
    const completionRate =
      missions.length > 0
        ? (missions.filter((m) => m.status === 'completed').length / missions.length) * 100
        : 0;

    if (completionRate > 90) {
      recommendations.push({
        type: 'performance',
        title: 'Excellente Performance',
        message: `Taux de réussite de ${completionRate.toFixed(1)}% - Continuez ainsi!`,
        color: 'green',
      });
    }

    // Timing recommendation
    const now = new Date();
    const currentHour = now.getHours();
    if (currentHour >= 14 && currentHour <= 17) {
      recommendations.push({
        type: 'timing',
        title: 'Planification',
        message: 'Évitez les heures de pointe 14h-17h pour optimiser les délais',
        color: 'orange',
      });
    }

    return recommendations;
  }

  static getMonthlySummary(missions: Mission[]) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyMissions = missions.filter((m) => new Date(m.createdAt) >= monthStart);

    const created = monthlyMissions.length;
    const completed = monthlyMissions.filter((m) => m.status === 'completed').length;
    const totalCost = monthlyMissions
      .filter((m) => m.status === 'completed')
      .reduce((sum, m) => sum + (m.budgetMin || 0), 0);

    // Estimate savings (mock calculation)
    const estimatedSavings = totalCost * 0.05; // 5% savings estimate

    const onTimeDeliveries = completed; // Assume all completed are on time for now
    const onTimeRate = completed > 0 ? (onTimeDeliveries / completed) * 100 : 0;

    // Calculate success rate (completed missions / total missions)
    const successRate = created > 0 ? (completed / created) * 100 : 0;

    return {
      created,
      completed,
      totalCost,
      savings: estimatedSavings,
      onTimeRate,
      successRate,
    };
  }

  // static calculateActiveUsersToday(users: User[]): number {
  //   const today = new Date();
  //   const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  //   return users?.filter((user) => {
  //     if (!user.lastLoginAt) return false;
  //     const lastLogin = new Date(user.lastLoginAt);
  //     return lastLogin >= todayStart;
  //   }).length;
  // }

  static calculateNewUsersThisMonth(users: User[]): number {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return users?.filter((user) => {
      const createdAt = new Date(user.createdAt);
      return createdAt >= monthStart;
    }).length;
  }

  static calculateNewMissionsThisMonth(missions: Mission[]): number {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return missions?.filter((mission) => {
      const createdAt = new Date(mission.createdAt);
      return createdAt >= monthStart;
    }).length;
  }

  static calculateSuccessRate(completedMissions: number, totalMissions: number): string {
    if (totalMissions === 0) return '0.0';
    const rate = (completedMissions / totalMissions) * 100;
    return rate.toFixed(1);
  }

  static calculateNewUsersLastMonth(users: User[]): number {
    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    return users?.filter((user) => {
      const createdAt = new Date(user.createdAt);
      return createdAt >= lastMonthStart && createdAt <= lastMonthEnd;
    }).length;
  }
}
