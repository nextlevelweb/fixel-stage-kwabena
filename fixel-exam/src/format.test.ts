import { describe, it, expect } from "vitest";
import { timeAgo } from "./format";

// ISO date, some minutes ago
function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60000).toISOString();
}

describe("timeAgo", function () {
  it("says zojuist for a new item", function () {
    expect(timeAgo(minutesAgo(0))).toBe("zojuist");
  });

  it("uses minutes, hours and days", function () {
    expect(timeAgo(minutesAgo(5))).toBe("5m geleden");
    expect(timeAgo(minutesAgo(180))).toBe("3u geleden");
    expect(timeAgo(minutesAgo(60 * 24 * 2))).toBe("2d geleden");
  });
});
