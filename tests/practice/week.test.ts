import { describe, expect, test } from "bun:test";
import { easternWeek } from "../../src/practice/week.ts";

const week = (iso: string) => easternWeek({ instant: new Date(iso) });

describe("easternWeek", () => {
  test("week 0 starts at midnight Eastern Time on Monday 1970-01-05", () => {
    expect(week("1970-01-05T05:00:00Z")).toBe(0);
    expect(week("1970-01-05T04:59:59Z")).toBe(-1);
  });

  test("a week ends at midnight between Sunday and Monday Eastern Time, in standard time", () => {
    const sunday = week("2026-11-30T04:59:59Z"); // Sunday 2026-11-29 23:59:59 EST
    expect(week("2026-11-30T05:00:00Z")).toBe(sunday + 1); // Monday 00:00 EST
    expect(week("2026-11-23T05:00:00Z")).toBe(sunday); // the Monday that started it
    expect(week("2026-11-30T02:00:00Z")).toBe(sunday); // already Monday in UTC, still Sunday in New York
  });

  test("the boundary follows daylight saving time", () => {
    const sunday = week("2026-03-09T03:59:59Z"); // Sunday 2026-03-08 23:59:59 EDT, the day clocks sprang forward
    expect(week("2026-03-09T04:00:00Z")).toBe(sunday + 1); // Monday 00:00 EDT
  });

  test("accepts the instant as a Date, milliseconds, or an ISO string", () => {
    const iso = "2026-11-25T17:00:00Z";
    expect(easternWeek({ instant: Date.parse(iso) })).toBe(week(iso));
    expect(easternWeek({ instant: iso })).toBe(week(iso));
  });
});
