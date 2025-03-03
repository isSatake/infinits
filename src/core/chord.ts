import { Chord, KeySignature, PitchAcc } from "@/core/types";

/**
 * convert chord to pitchAcc
 * C4を基準とする
 * 例1: chord: { root: { note: "C" }, type: "" }, key: { type: "C", sign: "sharp", count: 0 }
 * -> [{ pitch: 0 }, { pitch: 2 }, { pitch: 4 }]
 * 例2: chord: { root: { note: "G" }, type: "maj7" }, key: { type: "G", sign:  "sharp", count: 1 }
 * -> [{ pitch: 4 }, { pitch: 6 }, { pitch: 8 }, { pitch: 10 }]
 * 例3: chord: { root: { note: "C" }, type: "°7" }, key: { type: "C", sign: "sharp", count: 0 }
 * -> [{ pitch: 0 }, { pitch: 2, accidental: "flat" }, { pitch: 4, accidental: "flat" }, { pitch: 6, accidental: "dFlat" }]
 */
export const chordToPitchAcc = (
  chord: Chord,
  key: KeySignature
): PitchAcc[] => {
  const { pitch } = chord.root;
  const degree = (pitch - key.root.pitch + 7) % 7;
  // I
  if (degree === 0) {
    if (chord.type === "") {
      return [{ pitch }, { pitch: pitch + 2 }, { pitch: pitch + 4 }];
    }
    if (chord.type === "maj7") {
      return [
        { pitch },
        { pitch: pitch + 2 },
        { pitch: pitch + 4 },
        { pitch: pitch + 6 },
      ];
    }
    if (chord.type === "m") {
      return [
        { pitch },
        { pitch: pitch + 2, accidental: "flat" },
        { pitch: pitch + 4 },
      ];
    }
    if (chord.type === "m7") {
      return [
        { pitch },
        { pitch: pitch + 2, accidental: "flat" },
        { pitch: pitch + 4 },
        { pitch: pitch + 6 },
      ];
    }
    if (chord.type === "m7b5") {
      return [
        { pitch },
        { pitch: pitch + 2, accidental: "flat" },
        { pitch: pitch + 4, accidental: "flat" },
        { pitch: pitch + 6, accidental: "flat" },
      ];
    }
    if (chord.type === "7") {
      return [
        { pitch },
        { pitch: pitch + 2 },
        { pitch: pitch + 4 },
        { pitch: pitch + 6, accidental: "flat" },
      ];
    }
  }
  // II
  if (degree === 1) {
    if (chord.type === "") {
      return [
        { pitch },
        { pitch: pitch + 2, accidental: "sharp" },
        { pitch: pitch + 4 },
      ];
    }
    if (chord.type === "maj7") {
      return [
        { pitch },
        { pitch: pitch + 2, accidental: "sharp" },
        { pitch: pitch + 4 },
        { pitch: pitch + 6, accidental: "sharp" },
      ];
    }
    if (chord.type === "m") {
      return [{ pitch }, { pitch: pitch + 2 }, { pitch: pitch + 4 }];
    }
    if (chord.type === "m7") {
      return [
        { pitch },
        { pitch: pitch + 2 },
        { pitch: pitch + 4 },
        { pitch: pitch + 6 },
      ];
    }
    if (chord.type === "m7b5") {
      return [
        { pitch },
        { pitch: pitch + 2 },
        { pitch: pitch + 4, accidental: "flat" },
        { pitch: pitch + 6 },
      ];
    }
    if (chord.type === "7") {
      return [
        { pitch },
        { pitch: pitch + 2, accidental: "sharp" },
        { pitch: pitch + 4 },
        { pitch: pitch + 6 },
      ];
    }
  }
  // III
  if (degree === 2) {
    if (chord.type === "") {
      return [
        { pitch },
        { pitch: pitch + 2, accidental: "sharp" },
        { pitch: pitch + 4 },
      ];
    }
    if (chord.type === "maj7") {
      return [
        { pitch },
        { pitch: pitch + 2, accidental: "sharp" },
        { pitch: pitch + 4 },
        { pitch: pitch + 6, accidental: "sharp" },
      ];
    }
    if (chord.type === "m") {
      return [{ pitch }, { pitch: pitch + 2 }, { pitch: pitch + 4 }];
    }
    if (chord.type === "m7") {
      return [
        { pitch },
        { pitch: pitch + 2 },
        { pitch: pitch + 4 },
        { pitch: pitch + 6 },
      ];
    }
    if (chord.type === "m7b5") {
      return [
        { pitch },
        { pitch: pitch + 2 },
        { pitch: pitch + 4, accidental: "flat" },
        { pitch: pitch + 6 },
      ];
    }
    if (chord.type === "7") {
      return [
        { pitch },
        { pitch: pitch + 2, accidental: "sharp" },
        { pitch: pitch + 4 },
        { pitch: pitch + 6 },
      ];
    }
  }
  // IV
  if (degree === 3) {
    if (chord.type === "") {
      return [{ pitch }, { pitch: pitch + 2 }, { pitch: pitch + 4 }];
    }
    if (chord.type === "maj7") {
      return [
        { pitch },
        { pitch: pitch + 2 },
        { pitch: pitch + 4 },
        { pitch: pitch + 6 },
      ];
    }
    if (chord.type === "m") {
      return [
        { pitch },
        { pitch: pitch + 2, accidental: "flat" },
        { pitch: pitch + 4 },
      ];
    }
    if (chord.type === "m7") {
      return [
        { pitch },
        { pitch: pitch + 2, accidental: "flat" },
        { pitch: pitch + 4 },
        { pitch: pitch + 6, accidental: "flat" },
      ];
    }
    if (chord.type === "m7b5") {
      return [
        { pitch },
        { pitch: pitch + 2, accidental: "flat" },
        { pitch: pitch + 4, accidental: "flat" },
        { pitch: pitch + 6, accidental: "flat" },
      ];
    }
    if (chord.type === "7") {
      return [
        { pitch },
        { pitch: pitch + 2 },
        { pitch: pitch + 4 },
        { pitch: pitch + 6, accidental: "flat" },
      ];
    }
  }
  // V
  if (degree === 4) {
    if (chord.type === "") {
      return [{ pitch }, { pitch: pitch + 2 }, { pitch: pitch + 4 }];
    }
    if (chord.type === "maj7") {
      return [
        { pitch },
        { pitch: pitch + 2 },
        { pitch: pitch + 4 },
        { pitch: pitch + 6, accidental: "sharp" },
      ];
    }
    if (chord.type === "m") {
      return [
        { pitch },
        { pitch: pitch + 2, accidental: "flat" },
        { pitch: pitch + 4 },
      ];
    }
    if (chord.type === "m7") {
      return [
        { pitch },
        { pitch: pitch + 2, accidental: "flat" },
        { pitch: pitch + 4 },
        { pitch: pitch + 6 },
      ];
    }
    if (chord.type === "m7b5") {
      return [
        { pitch },
        { pitch: pitch + 2, accidental: "flat" },
        { pitch: pitch + 4, accidental: "flat" },
        { pitch: pitch + 6 },
      ];
    }
    if (chord.type === "7") {
      return [
        { pitch },
        { pitch: pitch + 2 },
        { pitch: pitch + 4 },
        { pitch: pitch + 6 },
      ];
    }
  }
  // VI
  if (degree === 5) {
    if (chord.type === "") {
      return [
        { pitch },
        { pitch: pitch + 2, accidental: "sharp" },
        { pitch: pitch + 4 },
      ];
    }
    if (chord.type === "maj7") {
      return [
        { pitch },
        { pitch: pitch + 2, accidental: "sharp" },
        { pitch: pitch + 4 },
        { pitch: pitch + 6, accidental: "sharp" },
      ];
    }
    if (chord.type === "m") {
      return [{ pitch }, { pitch: pitch + 2 }, { pitch: pitch + 4 }];
    }
    if (chord.type === "m7") {
      return [
        { pitch },
        { pitch: pitch + 2 },
        { pitch: pitch + 4 },
        { pitch: pitch + 6 },
      ];
    }
    if (chord.type === "m7b5") {
      return [
        { pitch },
        { pitch: pitch + 2 },
        { pitch: pitch + 4, accidental: "flat" },
        { pitch: pitch + 6 },
      ];
    }
    if (chord.type === "7") {
      return [
        { pitch },
        { pitch: pitch + 2, accidental: "sharp" },
        { pitch: pitch + 4 },
        { pitch: pitch + 6 },
      ];
    }
  }
  // VII
  if (degree === 6) {
    if (chord.type === "") {
      return [
        { pitch },
        { pitch: pitch + 2, accidental: "sharp" },
        { pitch: pitch + 4, accidental: "sharp" },
      ];
    }
    if (chord.type === "maj7") {
      return [
        { pitch },
        { pitch: pitch + 2, accidental: "sharp" },
        { pitch: pitch + 4, accidental: "sharp" },
        { pitch: pitch + 6, accidental: "sharp" },
      ];
    }
    if (chord.type === "m") {
      return [
        { pitch },
        { pitch: pitch + 2 },
        { pitch: pitch + 4, accidental: "sharp" },
      ];
    }
    if (chord.type === "m7") {
      return [
        { pitch },
        { pitch: pitch + 2 },
        { pitch: pitch + 4, accidental: "sharp" },
        { pitch: pitch + 6 },
      ];
    }
    if (chord.type === "m7b5") {
      return [
        { pitch },
        { pitch: pitch + 2 },
        { pitch: pitch + 4 },
        { pitch: pitch + 6 },
      ];
    }
    if (chord.type === "7") {
      return [
        { pitch },
        { pitch: pitch + 2, accidental: "sharp" },
        { pitch: pitch + 4, accidental: "sharp" },
        { pitch: pitch + 6 },
      ];
    }
  }
  return [];
};
