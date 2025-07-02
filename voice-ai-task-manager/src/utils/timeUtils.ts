/**
 * Time utility functions for productivity insights
 */

export function formatTimeOfDay(hour: number): string {
  if (hour < 12) {
    return hour === 0 ? "12 AM" : `${hour} AM`;
  } else if (hour === 12) {
    return "12 PM";
  } else {
    return `${hour - 12} PM`;
  }
}

export function getHourRange(startHour: number, endHour: number): string {
  return `${formatTimeOfDay(startHour)} - ${formatTimeOfDay(endHour)}`;
}

export function getTimeOfDayCategory(hour: number): string {
  if (hour >= 6 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 22) return "Evening";
  return "Night";
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}
