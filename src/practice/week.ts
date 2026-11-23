/** Redraw's streak weeks run Monday 00:00 to Sunday 24:00 in this time zone. */
export const STREAK_TIME_ZONE = "America/New_York";

const DAY = 86_400_000;
// 1970-01-05 was a Monday, four days after the Unix epoch: it starts week 0.
const FIRST_MONDAY = 4;

const calendar = new Intl.DateTimeFormat("en-US", {
  timeZone: STREAK_TIME_ZONE, year: "numeric", month: "numeric", day: "numeric",
});

/**
 * The number of the Eastern Time week containing `instant`. Week 0 began on Monday
 * 1970-01-05 at midnight Eastern Time, and week n + 1 immediately follows week n.
 * Weeks follow the local calendar date, so they stay aligned across daylight saving changes.
 */
export function easternWeek({ instant }: { instant: Date | number | string }): number {
  const parts = Object.fromEntries(calendar.formatToParts(new Date(instant)).map(({ type, value }) => [type, value]));
  const day = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)) / DAY;
  return Math.floor((day - FIRST_MONDAY) / 7);
}
