/**
 * Date helper functions for meal planner
 * 
 * These functions handle week calculations and date formatting
 * for the meal planner feature.
 */

/**
 * Get the start of the week (Monday) for a given date
 * @param date - The date to calculate the week start for
 * @returns A new Date object representing Monday of that week
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  return d;
}

/**
 * Get an array of date strings (YYYY-MM-DD) for a week starting from weekStart
 * @param weekStart - The start date of the week (Monday)
 * @returns Array of 7 date strings
 */
export function getWeekDates(weekStart: Date): string[] {
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dateString = date.toISOString().split("T")[0];
    if (dateString) {
      dates.push(dateString);
    }
  }
  return dates;
}

/**
 * Format a date string for display
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Object with dayName, dayNumber, and isToday flag
 */
export function formatDateDisplay(dateString: string): {
  dayName: string;
  dayNumber: number;
  isToday: boolean;
} {
  const date = new Date(dateString);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
  const dayNumber = date.getDate();

  return { dayName, dayNumber, isToday };
}
