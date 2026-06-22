import { describe, expect, it } from "vitest";
import {
  addMonths,
  currentDayStreak,
  dayKey,
  monthGrid,
  startOfMonth,
  startOfWeek,
  weekdayLabels,
} from "./date";

describe("startOfMonth", () => {
  it("snaps to the 1st at local midnight", () => {
    const d = startOfMonth(new Date(2026, 5, 22, 13, 31)); // 22 Jun 2026
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5);
    expect(d.getDate()).toBe(1);
    expect(d.getHours()).toBe(0);
  });
});

describe("addMonths", () => {
  it("avoids month-end overflow", () => {
    // Jan 31 + 1 month should land in February, not spill into March.
    const d = addMonths(new Date(2026, 0, 31), 1);
    expect(d.getMonth()).toBe(1);
  });

  it("wraps across the year boundary in both directions", () => {
    expect(addMonths(new Date(2026, 11, 10), 1).getMonth()).toBe(0); // Dec → Jan
    expect(addMonths(new Date(2026, 0, 10), -1).getMonth()).toBe(11); // Jan → Dec
  });
});

describe("weekdayLabels", () => {
  it("rotates to the configured first day", () => {
    expect(weekdayLabels(1)[0]).toBe("Mon");
    expect(weekdayLabels(0)[0]).toBe("Sun");
    expect(weekdayLabels(1)).toHaveLength(7);
  });
});

describe("monthGrid", () => {
  it("returns full weeks of 7 days starting on the configured day", () => {
    const grid = monthGrid(new Date(2026, 5, 15), 1); // June 2026, Monday start
    expect(grid.length).toBeGreaterThanOrEqual(4);
    expect(grid.length).toBeLessThanOrEqual(6);
    for (const week of grid) expect(week).toHaveLength(7);
    // Every first column is the configured week-start weekday.
    for (const week of grid) expect(week[0].getDay()).toBe(1);
  });

  it("contains every day of the target month exactly once", () => {
    const grid = monthGrid(new Date(2026, 1, 10), 0); // February 2026, Sunday start
    const inMonth = grid.flat().filter((d) => d.getMonth() === 1).map((d) => d.getDate());
    const daysInFeb2026 = 28;
    expect(new Set(inMonth).size).toBe(daysInFeb2026);
    expect(Math.max(...inMonth)).toBe(daysInFeb2026);
    expect(Math.min(...inMonth)).toBe(1);
  });

  it("aligns the first cell to or before the 1st of the month", () => {
    const grid = monthGrid(new Date(2026, 5, 1), 1);
    const firstCell = grid[0][0];
    const firstOfMonth = startOfMonth(new Date(2026, 5, 1));
    expect(firstCell.getTime()).toBeLessThanOrEqual(firstOfMonth.getTime());
    expect(firstCell.getTime()).toBe(startOfWeek(firstOfMonth, 1).getTime());
  });
});

describe("currentDayStreak", () => {
  const today = new Date(2026, 5, 22).getTime(); // Mon 22 Jun 2026
  const k = (offset: number) => dayKey(new Date(2026, 5, 22 + offset));

  it("counts consecutive days ending today", () => {
    const days = new Set([k(0), k(-1), k(-2)]);
    expect(currentDayStreak(days, today)).toBe(3);
  });

  it("still counts when today is a rest day but yesterday was trained", () => {
    const days = new Set([k(-1), k(-2)]);
    expect(currentDayStreak(days, today)).toBe(2);
  });

  it("breaks on a gap", () => {
    const days = new Set([k(0), k(-2), k(-3)]); // missing yesterday
    expect(currentDayStreak(days, today)).toBe(1);
  });

  it("is zero with no recent training", () => {
    expect(currentDayStreak(new Set([k(-5)]), today)).toBe(0);
  });
});
