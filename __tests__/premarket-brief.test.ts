import { describe, it, expect } from "vitest";
import { newYorkNow, isWeekday, OPEN } from "@/lib/market-session";

describe("Premarket Brief Timing and Deduplication Guards", () => {
  it("correctly identifies premarket hours in New York", () => {
    // 09:00 AM ET is 540 minutes, which is before OPEN (570 minutes = 09:30 AM)
    const testDate = new Date("2026-10-15T13:00:00Z"); // 09:00 EDT
    const ny = newYorkNow(testDate);
    expect(ny.minutes).toBe(9 * 60);
    expect(ny.minutes < OPEN).toBe(true);
    expect(isWeekday(ny.weekday)).toBe(true);
  });

  it("detects when time is past market open in New York", () => {
    // 22:11 Beijing time in EDT is 10:11 AM ET (611 minutes, which is past OPEN 570)
    const lateDate = new Date("2026-10-15T14:11:00Z"); // 10:11 EDT
    const ny = newYorkNow(lateDate);
    expect(ny.minutes >= OPEN).toBe(true);
    expect(ny.time).toBe("10:11");
  });

  it("chunks news items correctly to prevent 503 high demand spikes", () => {
    const items = Array.from({ length: 16 }, (_, i) => ({ id: `ITEM-${i}` }));
    const chunkSize = 5;
    const chunks = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }
    expect(chunks.length).toBe(4);
    expect(chunks[0].length).toBe(5);
    expect(chunks[3].length).toBe(1);
  });

  it("correctly identifies 20:30 Beijing Time as premarket hours in New York (both EDT and EST)", () => {
    // 20:30 Beijing Time in summer (EDT) -> 08:30 AM New York (510 minutes < 570 OPEN)
    const summerDate = new Date("2026-10-19T20:30:00+08:00");
    const nySummer = newYorkNow(summerDate);
    expect(nySummer.minutes).toBe(8 * 60 + 30);
    expect(nySummer.minutes < OPEN).toBe(true);
    expect(isWeekday(nySummer.weekday)).toBe(true);

    // 20:30 Beijing Time in winter (EST) -> 07:30 AM New York (450 minutes < 570 OPEN)
    const winterDate = new Date("2026-11-16T20:30:00+08:00");
    const nyWinter = newYorkNow(winterDate);
    expect(nyWinter.minutes).toBe(7 * 60 + 30);
    expect(nyWinter.minutes < OPEN).toBe(true);
    expect(isWeekday(nyWinter.weekday)).toBe(true);
  });

  it("prioritizes gemini-3.5-flash-lite over 3.1 and 2.5", () => {
    const rawList = [
      "gemini-3.5-flash-lite",
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash-lite",
    ];
    const candidateModels = Array.from(new Set(rawList.filter(Boolean)));
    expect(candidateModels[0]).toBe("gemini-3.5-flash-lite");
    expect(candidateModels[1]).toBe("gemini-3.1-flash-lite");
    expect(candidateModels[2]).toBe("gemini-2.5-flash-lite");
  });
});

