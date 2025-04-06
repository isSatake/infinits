import { chordToPitchAcc } from "../chord";
import { Chord, KeySignature, PitchAcc } from "@/core/types";
import * as vi from "vitest";

vi.describe("chordToPitchAcc", () => {
  vi.describe("C major key:", () => {
    const key: KeySignature = { root: { pitch: 0 }, acc: "sharp", pitches: [] };
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
        title: "Cm7b5",
        chord: { root: { pitch: 0 }, type: "m7b5" },
        key,
        expected: [
          { pitch: 0 },
          { pitch: 2, accidental: "flat" },
          { pitch: 4, accidental: "flat" },
          { pitch: 6, accidental: "flat" },
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
        title: "Dm7b5",
        chord: { root: { pitch: 1 }, type: "m7b5" },
        key,
        expected: [
          { pitch: 1 },
          { pitch: 3 },
          { pitch: 5, accidental: "flat" },
          { pitch: 7 },
        ],
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
      {
        title: "E",
        chord: { root: { pitch: 2 }, type: "" },
        key,
        expected: [
          { pitch: 2 },
          { pitch: 4, accidental: "sharp" },
          { pitch: 6 },
        ],
      },
      {
        title: "Emaj7",
        chord: { root: { pitch: 2 }, type: "maj7" },
        key,
        expected: [
          { pitch: 2 },
          { pitch: 4, accidental: "sharp" },
          { pitch: 6 },
          { pitch: 8, accidental: "sharp" },
        ],
      },
      {
        title: "Em",
        chord: { root: { pitch: 2 }, type: "m" },
        key,
        expected: [{ pitch: 2 }, { pitch: 4 }, { pitch: 6 }],
      },
      {
        title: "Em7",
        chord: { root: { pitch: 2 }, type: "m7" },
        key,
        expected: [{ pitch: 2 }, { pitch: 4 }, { pitch: 6 }, { pitch: 8 }],
      },
      {
        title: "Em7b5",
        chord: { root: { pitch: 2 }, type: "m7b5" },
        key,
        expected: [
          { pitch: 2 },
          { pitch: 4 },
          { pitch: 6, accidental: "flat" },
          { pitch: 8 },
        ],
      },
      {
        title: "E7",
        chord: { root: { pitch: 2 }, type: "7" },
        key,
        expected: [
          { pitch: 2 },
          { pitch: 4, accidental: "sharp" },
          { pitch: 6 },
          { pitch: 8 },
        ],
      },
      {
        title: "F",
        chord: { root: { pitch: 3 }, type: "" },
        key,
        expected: [{ pitch: 3 }, { pitch: 5 }, { pitch: 7 }],
      },
      {
        title: "Fmaj7",
        chord: { root: { pitch: 3 }, type: "maj7" },
        key,
        expected: [{ pitch: 3 }, { pitch: 5 }, { pitch: 7 }, { pitch: 9 }],
      },
      {
        title: "Fm",
        chord: { root: { pitch: 3 }, type: "m" },
        key,
        expected: [
          { pitch: 3 },
          { pitch: 5, accidental: "flat" },
          { pitch: 7 },
        ],
      },
      {
        title: "Fm7",
        chord: { root: { pitch: 3 }, type: "m7" },
        key,
        expected: [
          { pitch: 3 },
          { pitch: 5, accidental: "flat" },
          { pitch: 7 },
          { pitch: 9, accidental: "flat" },
        ],
      },
      {
        title: "Fm7b5",
        chord: { root: { pitch: 3 }, type: "m7b5" },
        key,
        expected: [
          { pitch: 3 },
          { pitch: 5, accidental: "flat" },
          { pitch: 7, accidental: "flat" },
          { pitch: 9, accidental: "flat" },
        ],
      },
      {
        title: "F7",
        chord: { root: { pitch: 3 }, type: "7" },
        key,
        expected: [
          { pitch: 3 },
          { pitch: 5 },
          { pitch: 7 },
          { pitch: 9, accidental: "flat" },
        ],
      },
      {
        title: "G",
        chord: { root: { pitch: 4 }, type: "" },
        key,
        expected: [{ pitch: 4 }, { pitch: 6 }, { pitch: 8 }],
      },
      {
        title: "Gmaj7",
        chord: { root: { pitch: 4 }, type: "maj7" },
        key,
        expected: [
          { pitch: 4 },
          { pitch: 6 },
          { pitch: 8 },
          { pitch: 10, accidental: "sharp" },
        ],
      },
      {
        title: "Gm",
        chord: { root: { pitch: 4 }, type: "m" },
        key,
        expected: [
          { pitch: 4 },
          { pitch: 6, accidental: "flat" },
          { pitch: 8 },
        ],
      },
      {
        title: "Gm7",
        chord: { root: { pitch: 4 }, type: "m7" },
        key,
        expected: [
          { pitch: 4 },
          { pitch: 6, accidental: "flat" },
          { pitch: 8 },
          { pitch: 10 },
        ],
      },
      {
        title: "Gm7b5",
        chord: { root: { pitch: 4 }, type: "m7b5" },
        key,
        expected: [
          { pitch: 4 },
          { pitch: 6, accidental: "flat" },
          { pitch: 8, accidental: "flat" },
          { pitch: 10 },
        ],
      },
      {
        title: "G7",
        chord: { root: { pitch: 4 }, type: "7" },
        key,
        expected: [{ pitch: 4 }, { pitch: 6 }, { pitch: 8 }, { pitch: 10 }],
      },
      {
        title: "A",
        chord: { root: { pitch: 5 }, type: "" },
        key,
        expected: [
          { pitch: 5 },
          { pitch: 7, accidental: "sharp" },
          { pitch: 9 },
        ],
      },
      {
        title: "Amaj7",
        chord: { root: { pitch: 5 }, type: "maj7" },
        key,
        expected: [
          { pitch: 5 },
          { pitch: 7, accidental: "sharp" },
          { pitch: 9 },
          { pitch: 11, accidental: "sharp" },
        ],
      },
      {
        title: "Am",
        chord: { root: { pitch: 5 }, type: "m" },
        key,
        expected: [{ pitch: 5 }, { pitch: 7 }, { pitch: 9 }],
      },
      {
        title: "Am7",
        chord: { root: { pitch: 5 }, type: "m7" },
        key,
        expected: [{ pitch: 5 }, { pitch: 7 }, { pitch: 9 }, { pitch: 11 }],
      },
      {
        title: "Am7b5",
        chord: { root: { pitch: 5 }, type: "m7b5" },
        key,
        expected: [
          { pitch: 5 },
          { pitch: 7 },
          { pitch: 9, accidental: "flat" },
          { pitch: 11 },
        ],
      },
      {
        title: "A7",
        chord: { root: { pitch: 5 }, type: "7" },
        key,
        expected: [
          { pitch: 5 },
          { pitch: 7, accidental: "sharp" },
          { pitch: 9 },
          { pitch: 11 },
        ],
      },
      {
        title: "B",
        chord: { root: { pitch: 6 }, type: "" },
        key,
        expected: [
          { pitch: 6 },
          { pitch: 8, accidental: "sharp" },
          { pitch: 10, accidental: "sharp" },
        ],
      },
      {
        title: "Bmaj7",
        chord: { root: { pitch: 6 }, type: "maj7" },
        key,
        expected: [
          { pitch: 6 },
          { pitch: 8, accidental: "sharp" },
          { pitch: 10, accidental: "sharp" },
          { pitch: 12, accidental: "sharp" },
        ],
      },
      {
        title: "Bm",
        chord: { root: { pitch: 6 }, type: "m" },
        key,
        expected: [
          { pitch: 6 },
          { pitch: 8 },
          { pitch: 10, accidental: "sharp" },
        ],
      },
      {
        title: "Bm7",
        chord: { root: { pitch: 6 }, type: "m7" },
        key,
        expected: [
          { pitch: 6 },
          { pitch: 8 },
          { pitch: 10, accidental: "sharp" },
          { pitch: 12 },
        ],
      },
      {
        title: "Bm7b5",
        chord: { root: { pitch: 6 }, type: "m7b5" },
        key,
        expected: [{ pitch: 6 }, { pitch: 8 }, { pitch: 10 }, { pitch: 12 }],
      },
      {
        title: "B7",
        chord: { root: { pitch: 6 }, type: "7" },
        key,
        expected: [
          { pitch: 6 },
          { pitch: 8, accidental: "sharp" },
          { pitch: 10, accidental: "sharp" },
          { pitch: 12 },
        ],
      },
    ])("$title", ({ chord, key, expected }) => {
      const result: PitchAcc[] = chordToPitchAcc(chord, key);
      vi.expect(result).toEqual(expected);
    });
  });
});
