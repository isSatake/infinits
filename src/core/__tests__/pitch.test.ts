import * as vi from "vitest";
import { convertPitchToRoot } from "../pitch";
import { RootNote } from "@/core/types";

vi.describe("convertPitchToRoot", () => {
  vi.test.each<{
    pitch: number;
    expected: RootNote;
  }>([
    { pitch: -7, expected: "C" },
    { pitch: -2, expected: "A" },
    { pitch: -1, expected: "B" },
    { pitch: 0, expected: "C" },
    { pitch: 1, expected: "D" },
    { pitch: 2, expected: "E" },
    { pitch: 7, expected: "C" },
  ])("pitch $pitch=$expected", ({ pitch, expected }) => {
    const result = convertPitchToRoot(pitch);
    vi.expect(result).toBe(expected);
  });
});
