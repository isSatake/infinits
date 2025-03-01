import { chordToPitchAcc } from "../chord";
import { Chord, KeySignature, PitchAcc } from "@/org/notation/types";
import * as vi from "vitest";

vi.describe("chordToPitchAcc", () => {
  vi.describe("C major key", () => {
    const key: KeySignature = { root: { pitch: 0 }, acc: "sharp" };
    vi.test.each<{
      chord: Chord;
      key: KeySignature;
      expected: PitchAcc[];
    }>([
      {
        // C
        chord: { root: { note: "C" }, type: "" },
        key,
        expected: [{ pitch: 0 }, { pitch: 2 }, { pitch: 4 }],
      },
      {
        // Cmaj7
        chord: { root: { note: "C" }, type: "maj7" },
        key,
        expected: [{ pitch: 0 }, { pitch: 2 }, { pitch: 4 }, { pitch: 6 }],
      },
      {
        // Cm
        chord: { root: { note: "C" }, type: "m" },
        key,
        expected: [{ pitch: 0 }, { pitch: 2, accidental: "flat" }, { pitch: 4 }],
      },
      {
        // Cm7
        chord: { root: { note: "C" }, type: "m7" },
        key,
        expected: [
          { pitch: 0 },
          { pitch: 2, accidental: "flat" },
          { pitch: 4 },
          { pitch: 6 },
        ],
      },
      {
        // C7
        chord: { root: { note: "C" }, type: "7" },
        key,
        expected: [{ pitch: 0 }, { pitch: 2 }, { pitch: 4 }, { pitch: 6 }],
      },
    ])("", ({ chord, key, expected }) => {
      const result: PitchAcc[] = chordToPitchAcc(chord, key);
      vi.expect(result).toEqual(expected);
    });
  });
});
