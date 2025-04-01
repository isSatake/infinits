import { Clef } from "@/core/types";
import * as vi from "vitest";
import { pitchToYScale } from "../pitch";

vi.describe("pitchToY", () => {
  vi.describe("g clef", () => {
    vi.test.each<{ desc: string; pitch: number; expected: number }>([
      { desc: "C4", pitch: 0, expected: 5.0 },
      { desc: "D4", pitch: 1, expected: 4.5 },
      { desc: "E4", pitch: 2, expected: 4.0 },
      { desc: "F4", pitch: 3, expected: 3.5 },
      { desc: "G4", pitch: 4, expected: 3.0 },
      { desc: "A4", pitch: 5, expected: 2.5 },
      { desc: "B4", pitch: 6, expected: 2.0 },
      { desc: "C5", pitch: 7, expected: 1.5 },
      { desc: "D5", pitch: 8, expected: 1.0 },
      { desc: "E5", pitch: 9, expected: 0.5 },
      { desc: "F5", pitch: 10, expected: 0.0 },
      { desc: "G5", pitch: 11, expected: -0.5 },
      { desc: "A5", pitch: 12, expected: -1.0 },
      { desc: "B5", pitch: 13, expected: -1.5 },
      { desc: "C6", pitch: 14, expected: -2.0 },
    ])("$desc", ({ pitch, expected }) => {
      const result = pitchToYScale("g", pitch);
      vi.expect(result).toBe(expected);
    });
  });
  vi.describe("f clef", () => {
    vi.test.each<{ desc: string; pitch: number; expected: number }>([
      { desc: "C4", pitch: 0, expected: 3.0 },
      { desc: "D4", pitch: 1, expected: 2.5 },
      { desc: "E4", pitch: 2, expected: 2.0 },
      { desc: "F4", pitch: 3, expected: 1.5 },
      { desc: "G4", pitch: 4, expected: 1.0 },
      { desc: "A4", pitch: 5, expected: 0.5 },
      { desc: "B4", pitch: 6, expected: 0.0 },
      { desc: "C5", pitch: 7, expected: -0.5 },
      { desc: "D5", pitch: 8, expected: -1.0 },
      { desc: "E5", pitch: 9, expected: -1.5 },
      { desc: "F5", pitch: 10, expected: -2.0 },
      { desc: "G5", pitch: 11, expected: -2.5 },
      { desc: "A5", pitch: 12, expected: -3.0 },
      { desc: "B5", pitch: 13, expected: -3.5 },
      { desc: "C6", pitch: 14, expected: -4.0 },
    ])("$desc", ({ pitch, expected }) => {
      const result = pitchToYScale("f", pitch);
      vi.expect(result).toBe(expected);
    });
  });
  vi.describe("c clef", () => {
    vi.test.each<{ desc: string; pitch: number; expected: number }>([
      { desc: "C4", pitch: 0, expected: 4.0 },
      { desc: "D4", pitch: 1, expected: 3.5 },
      { desc: "E4", pitch: 2, expected: 3.0 },
      { desc: "F4", pitch: 3, expected: 2.5 },
      { desc: "G4", pitch: 4, expected: 2.0 },
      { desc: "A4", pitch: 5, expected: 1.5 },
      { desc: "B4", pitch: 6, expected: 1.0 },
      { desc: "C5", pitch: 7, expected: 0.5 },
      { desc: "D5", pitch: 8, expected: 0.0 },
      { desc: "E5", pitch: 9, expected: -0.5 },
      { desc: "F5", pitch: 10, expected: -1.0 },
      { desc: "G5", pitch: 11, expected: -1.5 },
      { desc: "A5", pitch: 12, expected: -2.0 },
      { desc: "B5", pitch: 13, expected: -2.5 },
      { desc: "C6", pitch: 14, expected: -3.0 },
    ])("$desc", ({ pitch, expected }) => {
      const result = pitchToYScale("c", pitch);
      vi.expect(result).toBe(expected);
    });
  });
});
