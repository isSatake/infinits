import * as vi from "vitest";
import { pitchToYScale, yScaleToPitch } from "../pitch";

vi.describe("pitchToYScale", () => {
  vi.describe("g clef", () => {
    vi.test.each<{ desc: string; pitch: number; expected: number }>([
      { desc: "C6", pitch: 14, expected: -2.0 },
      { desc: "B5", pitch: 13, expected: -1.5 },
      { desc: "A5", pitch: 12, expected: -1.0 },
      { desc: "G5", pitch: 11, expected: -0.5 },
      { desc: "F5", pitch: 10, expected: 0.0 },
      { desc: "E5", pitch: 9, expected: 0.5 },
      { desc: "D5", pitch: 8, expected: 1.0 },
      { desc: "C5", pitch: 7, expected: 1.5 },
      { desc: "B4", pitch: 6, expected: 2.0 },
      { desc: "A4", pitch: 5, expected: 2.5 },
      { desc: "G4", pitch: 4, expected: 3.0 },
      { desc: "F4", pitch: 3, expected: 3.5 },
      { desc: "E4", pitch: 2, expected: 4.0 },
      { desc: "D4", pitch: 1, expected: 4.5 },
      { desc: "C4", pitch: 0, expected: 5.0 },
    ])("$desc", ({ pitch, expected }) => {
      const result = pitchToYScale("g", pitch);
      vi.expect(result).toBe(expected);
    });
  });
  vi.describe("f clef", () => {
    vi.test.each<{ desc: string; pitch: number; expected: number }>([
      { desc: "C4", pitch: 0, expected: -1.0 },
      { desc: "B3", pitch: -1, expected: -0.5 },
      { desc: "A3", pitch: -2, expected: 0.0 },
      { desc: "G3", pitch: -3, expected: 0.5 },
      { desc: "F3", pitch: -4, expected: 1.0 },
      { desc: "E3", pitch: -5, expected: 1.5 },
      { desc: "D3", pitch: -6, expected: 2.0 },
      { desc: "C3", pitch: -7, expected: 2.5 },
      { desc: "B2", pitch: -8, expected: 3.0 },
      { desc: "A2", pitch: -9, expected: 3.5 },
      { desc: "G2", pitch: -10, expected: 4.0 },
      { desc: "F2", pitch: -11, expected: 4.5 },
      { desc: "E2", pitch: -12, expected: 5.0 },
    ])("$desc", ({ pitch, expected }) => {
      const result = pitchToYScale("f", pitch);
      vi.expect(result).toBe(expected);
    });
  });
  vi.describe("c clef", () => {
    vi.test.each<{ desc: string; pitch: number; expected: number }>([
      { desc: "C5", pitch: 7, expected: -1.5 },
      { desc: "B4", pitch: 6, expected: -1.0 },
      { desc: "A4", pitch: 5, expected: -0.5 },
      { desc: "G4", pitch: 4, expected: 0.0 },
      { desc: "F4", pitch: 3, expected: 0.5 },
      { desc: "E4", pitch: 2, expected: 1.0 },
      { desc: "D4", pitch: 1, expected: 1.5 },
      { desc: "C4", pitch: 0, expected: 2.0 },
      { desc: "B3", pitch: -1, expected: 2.5 },
      { desc: "A3", pitch: -2, expected: 3.0 },
      { desc: "G3", pitch: -3, expected: 3.5 },
      { desc: "F3", pitch: -4, expected: 4.0 },
    ])("$desc", ({ pitch, expected }) => {
      const result = pitchToYScale("c", pitch);
      vi.expect(result).toBe(expected);
    });
  });
});

vi.describe("yScaleToPitch", () => {
  vi.describe("g clef", () => {
    vi.test.each<{ desc: string; y: number; expected: number }>([
      { desc: "C6", y: -2.0, expected: 14 },
      { desc: "B5", y: -1.5, expected: 13 },
      { desc: "A5", y: -1.0, expected: 12 },
      { desc: "G5", y: -0.5, expected: 11 },
      { desc: "F5", y: 0.0, expected: 10 },
      { desc: "E5", y: 0.5, expected: 9 },
      { desc: "D5", y: 1.0, expected: 8 },
      { desc: "C5", y: 1.5, expected: 7 },
      { desc: "B4", y: 2.0, expected: 6 },
      { desc: "A4", y: 2.5, expected: 5 },
      { desc: "G4", y: 3.0, expected: 4 },
      { desc: "F4", y: 3.5, expected: 3 },
      { desc: "E4", y: 4.0, expected: 2 },
      { desc: "D4", y: 4.5, expected: 1 },
      { desc: "C4", y: 5.0, expected: 0 },
    ])("$desc", ({ y, expected }) => {
      const result = yScaleToPitch("g", y);
      vi.expect(result).toBe(expected);
    });
  });
  vi.describe("f clef", () => {
    vi.test.each<{ desc: string; y: number; expected: number }>([
      { desc: "C4", y: -1.0, expected: 0 },
      { desc: "B3", y: -0.5, expected: -1 },
      { desc: "A3", y: 0.0, expected: -2 },
      { desc: "G3", y: 0.5, expected: -3 },
      { desc: "F3", y: 1.0, expected: -4 },
      { desc: "E3", y: 1.5, expected: -5 },
      { desc: "D3", y: 2.0, expected: -6 },
      { desc: "C3", y: 2.5, expected: -7 },
      { desc: "B2", y: 3.0, expected: -8 },
      { desc: "A2", y: 3.5, expected: -9 },
      { desc: "G2", y: 4.0, expected: -10 },
      { desc: "F2", y: 4.5, expected: -11 },
      { desc: "E2", y: 5.0, expected: -12 },
    ])("$desc", ({ y, expected }) => {
      const result = yScaleToPitch("f", y);
      vi.expect(result).toBe(expected);
    });
  });
  vi.describe("c clef", () => {
    vi.test.each<{ desc: string; y: number; expected: number }>([
      { desc: "C5", y: -1.5, expected: 7 },
      { desc: "B4", y: -1.0, expected: 6 },
      { desc: "A4", y: -0.5, expected: 5 },
      { desc: "G4", y: 0.0, expected: 4 },
      { desc: "F4", y: 0.5, expected: 3 },
      { desc: "E4", y: 1.0, expected: 2 },
      { desc: "D4", y: 1.5, expected: 1 },
      { desc: "C4", y: 2.0, expected: 0 },
      { desc: "B3", y: 2.5, expected: -1 },
      { desc: "A3", y: 3.0, expected: -2 },
      { desc: "G3", y: 3.5, expected: -3 },
      { desc: "F3", y: 4.0, expected: -4 },
    ])("$desc", ({ y, expected }) => {
      const result = yScaleToPitch("c", y);
      vi.expect(result).toBe(expected);
    });
  });
});
