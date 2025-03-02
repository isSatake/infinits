import { chordToPitchAcc } from "../chord";
import { Chord, KeySignature, PitchAcc } from "@/org/notation/types";
import * as vi from "vitest";

vi.describe("chordToPitchAcc", () => {
  vi.describe("C major key:", () => {
    const key: KeySignature = { root: { pitch: 0 }, acc: "sharp" };
    vi.test.each<{
      title: string;
      chord: Chord;
      key: KeySignature;
      expected: PitchAcc[];
    }>([
      {
        title: "C",
        chord: { root: { pitch: 0 }, type: "" },
        key,
        expected: [{ pitch: 0 }, { pitch: 2 }, { pitch: 4 }],
      },
      {
        title: "Cmaj7",
        chord: { root: { pitch: 0 }, type: "maj7" },
        key,
        expected: [{ pitch: 0 }, { pitch: 2 }, { pitch: 4 }, { pitch: 6 }],
      },
      {
        title: "Cm",
        chord: { root: { pitch: 0 }, type: "m" },
        key,
        expected: [
          { pitch: 0 },
          { pitch: 2, accidental: "flat" },
          { pitch: 4 },
        ],
      },
      {
        title: "Cm7",
        chord: { root: { pitch: 0 }, type: "m7" },
        key,
        expected: [
          { pitch: 0 },
          { pitch: 2, accidental: "flat" },
          { pitch: 4 },
          { pitch: 6 },
        ],
      },
      {
        title: "C7",
        chord: { root: { pitch: 0 }, type: "7" },
        key,
        expected: [
          { pitch: 0 },
          { pitch: 2 },
          { pitch: 4 },
          { pitch: 6, accidental: "flat" },
        ],
      },
      {
        title: "D",
        chord: { root: { pitch: 1 }, type: "" },
        key,
        expected: [
          { pitch: 1 },
          { pitch: 3, accidental: "sharp" },
          { pitch: 5 },
        ],
      },
      {
        title: "Dmaj7",
        chord: { root: { pitch: 1 }, type: "maj7" },
        key,
        expected: [
          { pitch: 1 },
          { pitch: 3, accidental: "sharp" },
          { pitch: 5 },
          { pitch: 7, accidental: "sharp" },
        ],
      },
      {
        title: "Dm",
        chord: { root: { pitch: 1 }, type: "m" },
        key,
        expected: [{ pitch: 1 }, { pitch: 3 }, { pitch: 5 }],
      },
      {
        title: "Dm7",
        chord: { root: { pitch: 1 }, type: "m7" },
        key,
        expected: [{ pitch: 1 }, { pitch: 3 }, { pitch: 5 }, { pitch: 7 }],
      },
      {
        title: "D7",
        chord: { root: { pitch: 1 }, type: "7" },
        key,
        expected: [
          { pitch: 1 },
          { pitch: 3, accidental: "sharp" },
          { pitch: 5 },
          { pitch: 7 },
        ],
      },
    ])("$title", ({ chord, key, expected }) => {
      const result: PitchAcc[] = chordToPitchAcc(chord, key);
      vi.expect(result).toEqual(expected);
    });
  });
});
