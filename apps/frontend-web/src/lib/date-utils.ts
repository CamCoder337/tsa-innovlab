import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Format a date to a human-readable string
 * @param date Date object or ISO string
 * @returns Formatted date string (e.g., "15 janvier 2023")
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'd MMMM yyyy', { locale: fr });
};

/**
 * Format a date and time to a human-readable string
 * @param date Date object or ISO string
 * @returns Formatted date and time string (e.g., "15 janvier 2023 à 14:30")
 */
export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, "d MMMM yyyy 'à' HH:mm", { locale: fr });
};

/**
 * Format a time to a human-readable string
 * @param date Date object or ISO string
 * @returns Formatted time string (e.g., "14:30")
 */
export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'HH:mm', { locale: fr });
};

/**
 * Get the relative time from now (e.g., "il y a 2 heures")
 * @param date Date object or ISO string
 * @returns Relative time string
 */
export const timeAgo = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, {
    addSuffix: true,
    locale: fr,
  });
};

/**
 * Format a duration in minutes to a human-readable string (e.g., "2h 30min")
 * @param minutes Duration in minutes
 * @returns Formatted duration string
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}min`;
};

/**
 * Format a distance in meters to a human-readable string (e.g., "2,5 km")
 * @param meters Distance in meters
 * @returns Formatted distance string
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km`;
};

/**
 * Format a speed in meters per second to km/h
 * @param mps Speed in meters per second
 * @returns Formatted speed string (e.g., "50 km/h")
 */
export const formatSpeed = (mps: number | undefined): string => {
  if (mps === undefined) return 'N/A';
  const kmh = mps * 3.6; // Convert m/s to km/h
  return `${Math.round(kmh)} km/h`;
};

/**
 * Get the time difference between two dates in minutes
 * @param start Start date
 * @param end End date (defaults to now)
 * @returns Time difference in minutes
 */
export const getTimeDifferenceInMinutes = (
  start: Date | string,
  end: Date | string = new Date()
): number => {
  const startDate = typeof start === 'string' ? parseISO(start) : start;
  const endDate = typeof end === 'string' ? parseISO(end) : end;

  return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
};

/**
 * Format a date range (e.g., "15-16 janvier 2023" or "15 janvier - 15 février 2023")
 * @param start Start date
 * @param end End date
 * @returns Formatted date range string
 */
export const formatDateRange = (start: Date | string, end: Date | string): string => {
  const startDate = typeof start === 'string' ? parseISO(start) : start;
  const endDate = typeof end === 'string' ? parseISO(end) : end;

  const startDay = startDate.getDate();
  const startMonth = startDate.getMonth();
  const startYear = startDate.getFullYear();

  const endDay = endDate.getDate();
  const endMonth = endDate.getMonth();
  const endYear = endDate.getFullYear();

  if (startYear === endYear && startMonth === endMonth) {
    // Same month and year, e.g., "15-16 janvier 2023"
    return `${startDay}-${endDay} ${format(startDate, 'MMMM yyyy', { locale: fr })}`;
  } else if (startYear === endYear) {
    // Same year, different months, e.g., "30 janvier - 2 février 2023"
    return `${startDay} ${format(startDate, 'MMMM', { locale: fr })} - ${endDay} ${format(endDate, 'MMMM yyyy', { locale: fr })}`;
  } else {
    // Different years, e.g., "30 décembre 2022 - 2 janvier 2023"
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }
};

/**
 * Check if a date is today
 * @param date Date to check
 * @returns Boolean indicating if the date is today
 */
export const isToday = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const today = new Date();

  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
};

/**
 * Format a date to a relative time if it's recent, or absolute time if it's older
 * @param date Date to format
 * @param daysThreshold Number of days to consider as "recent" (default: 7)
 * @returns Formatted date string
 */
export const smartFormatDate = (date: Date | string, daysThreshold: number = 7): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const diffInDays = Math.round((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));

  if (isToday(dateObj)) {
    return `Aujourd'hui, ${formatTime(dateObj)}`;
  } else if (diffInDays < daysThreshold) {
    return timeAgo(dateObj);
  } else if (dateObj.getFullYear() === now.getFullYear()) {
    return format(dateObj, "d MMMM 'à' HH:mm", { locale: fr });
  } else {
    return formatDateTime(dateObj);
  }
};
