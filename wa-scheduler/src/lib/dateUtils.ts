import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz';

const DEFAULT_TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Pontianak';

/**
 * Get the current time in the application's default timezone.
 * @returns The current Date object zoned to the application's timezone.
 */
export function getCurrentTimeInZone(): Date {
  return utcToZonedTime(new Date(), DEFAULT_TIMEZONE);
}

/**
 * Converts a Date object to a string representation in the application's timezone.
 * @param date The date to format.
 * @param formatString The desired output format.
 * @returns A formatted date string.
 */
export function formatDateInZone(date: Date, formatString: string = 'yyyy-MM-dd HH:mm:ss'): string {
  return format(utcToZonedTime(date, DEFAULT_TIMEZONE), formatString, { timeZone: DEFAULT_TIMEZONE });
}

/**
 * Converts a local time string (e.g., "2023-10-27 15:30") from the app's timezone to a UTC Date object.
 * @param dateString The local date and time string.
 * @returns A Date object in UTC.
 */
export function localStringToUtc(dateString: string): Date {
  return zonedTimeToUtc(dateString, DEFAULT_TIMEZONE);
}
