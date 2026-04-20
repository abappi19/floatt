import { describe, expect, it } from "vitest";
import { nextOccurrence } from "./repeat";

describe("nextOccurrence — daily", () => {
  it("adds interval days", () => {
    const next = nextOccurrence(
      { kind: "daily", interval: 1 },
      new Date(2026, 3, 20),
    );
    expect(next.toDateString()).toBe(new Date(2026, 3, 21).toDateString());
  });

  it("respects interval > 1", () => {
    const next = nextOccurrence(
      { kind: "daily", interval: 3 },
      new Date(2026, 3, 20),
    );
    expect(next.toDateString()).toBe(new Date(2026, 3, 23).toDateString());
  });
});

describe("nextOccurrence — weekdays", () => {
  it("Fri (2026-04-24) -> Mon (2026-04-27)", () => {
    const fri = new Date(2026, 3, 24);
    const next = nextOccurrence({ kind: "weekdays", interval: 1 }, fri);
    expect(next.toDateString()).toBe(new Date(2026, 3, 27).toDateString());
  });

  it("Mon -> Tue", () => {
    const mon = new Date(2026, 3, 27);
    const next = nextOccurrence({ kind: "weekdays", interval: 1 }, mon);
    expect(next.toDateString()).toBe(new Date(2026, 3, 28).toDateString());
  });

  it("Sat -> Mon", () => {
    const sat = new Date(2026, 3, 25);
    const next = nextOccurrence({ kind: "weekdays", interval: 1 }, sat);
    expect(next.toDateString()).toBe(new Date(2026, 3, 27).toDateString());
  });
});

describe("nextOccurrence — weekly", () => {
  it("interval 2 weeks keeps weekday", () => {
    const mon = new Date(2026, 3, 20);
    const next = nextOccurrence({ kind: "weekly", interval: 2 }, mon);
    expect(next.toDateString()).toBe(new Date(2026, 4, 4).toDateString());
  });
});

describe("nextOccurrence — monthly", () => {
  it("Jan 31 -> Feb 28 (2026 non-leap)", () => {
    const anchor = new Date(2026, 0, 31);
    const next = nextOccurrence(
      { kind: "monthly", interval: 1 },
      anchor,
      anchor,
    );
    expect(next.getMonth()).toBe(1);
    expect(next.getDate()).toBe(28);
  });

  it("Jan 31 -> Feb 29 (2024 leap year)", () => {
    const anchor = new Date(2024, 0, 31);
    const next = nextOccurrence(
      { kind: "monthly", interval: 1 },
      anchor,
      anchor,
    );
    expect(next.getMonth()).toBe(1);
    expect(next.getDate()).toBe(29);
  });

  it("Feb 28 with anchor Jan 31 -> Mar 31 (preserves original day)", () => {
    const anchor = new Date(2026, 0, 31);
    const prev = new Date(2026, 1, 28);
    const next = nextOccurrence(
      { kind: "monthly", interval: 1 },
      prev,
      anchor,
    );
    expect(next.getMonth()).toBe(2);
    expect(next.getDate()).toBe(31);
  });
});

describe("nextOccurrence — yearly", () => {
  it("Feb 29 (leap) -> Feb 28 (non-leap)", () => {
    const anchor = new Date(2024, 1, 29);
    const next = nextOccurrence(
      { kind: "yearly", interval: 1 },
      anchor,
      anchor,
    );
    expect(next.getFullYear()).toBe(2025);
    expect(next.getMonth()).toBe(1);
    expect(next.getDate()).toBe(28);
  });

  it("Feb 29 anchor -> Feb 29 again after 4 years", () => {
    const anchor = new Date(2024, 1, 29);
    const prev = new Date(2027, 1, 28);
    const next = nextOccurrence(
      { kind: "yearly", interval: 1 },
      prev,
      anchor,
    );
    expect(next.getFullYear()).toBe(2028);
    expect(next.getMonth()).toBe(1);
    expect(next.getDate()).toBe(29);
  });
});

describe("nextOccurrence — DST safety", () => {
  it("daily across DST spring-forward stays at calendar +1 day", () => {
    const prev = new Date(2026, 2, 7, 9, 0);
    const next = nextOccurrence({ kind: "daily", interval: 1 }, prev);
    expect(next.getDate()).toBe(8);
    expect(next.getMonth()).toBe(2);
  });
});
