/**
 * Timezone and Date Utilities for GoalPulse
 * Default timezone: Africa/Nairobi (East Africa Time, UTC+3)
 */

export const DEFAULT_TIMEZONE = 'Africa/Nairobi';

export function formatToEAT(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: DEFAULT_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return '--:--';
  }
}

export function formatMatchDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: DEFAULT_TIMEZONE,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(date);
  } catch {
    return '';
  }
}

export function formatFullMatchDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: DEFAULT_TIMEZONE,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return isoString;
  }
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDateOffsetString(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getRelativeDayLabel(dateStr: string): string {
  const today = getTodayDateString();
  const yesterday = getDateOffsetString(-1);
  const tomorrow = getDateOffsetString(1);

  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  if (dateStr === tomorrow) return 'Tomorrow';

  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(d);
  }
  return dateStr;
}
