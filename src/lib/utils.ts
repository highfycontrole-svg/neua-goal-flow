import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse a date string (yyyy-MM-dd) to a Date object in local timezone.
 * This prevents the common issue where dates are shifted one day earlier
 * due to UTC interpretation.
 */
export function parseDateStringToLocal(dateStr: string | null | undefined): Date | undefined {
  if (!dateStr) return undefined;
  // Split the date string and create date using local timezone
  const [year, month, day] = dateStr.split('-').map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return undefined;
  return new Date(year, month - 1, day);
}

/**
 * Format a Date object to yyyy-MM-dd string for database storage.
 * Uses local date components to avoid timezone shift.
 */
export function formatDateToString(date: Date | null | undefined): string | null {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
