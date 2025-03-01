import { Chord, KeySignature, PitchAcc } from "@/org/notation/types";

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
  if (chord.type === "") {
    return [{ pitch: 0 }, { pitch: 2 }, { pitch: 4 }];
  }
  if (chord.type === "maj7") {
    return [{ pitch: 0 }, { pitch: 2 }, { pitch: 4 }, { pitch: 6 }];
  }
  if (chord.type === "m") {
    return [{ pitch: 0 }, { pitch: 2, accidental: "flat" }, { pitch: 4 }];
  }
  if (chord.type === "m7") {
    return [
      { pitch: 0 },
      { pitch: 2, accidental: "flat" },
      { pitch: 4 },
      { pitch: 6 },
    ];
  }
  if (chord.type === "7") {
    return [{ pitch: 0 }, { pitch: 2 }, { pitch: 4 }, { pitch: 6 }];
  }
  return [];
};
