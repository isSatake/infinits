import { Pitch, PitchAcc, RootNote } from "../org/notation/types";

export const sortPitches = (pitches: PitchAcc[]): PitchAcc[] => {
  return pitches.sort((pa0, pa1) => {
    // 0が低ければ-1返す
    if (pa0.pitch === pa1.pitch) {
      if (
        pa0.accidental === pa1.accidental ||
        (!pa0.accidental && pa1.accidental === "natural") ||
        (pa0.accidental === "natural" && !pa1.accidental)
      ) {
        return 0;
      } else if (
        (pa0.accidental === "flat" && pa1.accidental !== "flat") ||
        ((pa0.accidental === "natural" || !pa0.accidental) &&
          pa1.accidental === "sharp")
      ) {
        return -1;
      } else {
        return 1;
      }
    } else {
      if (pa0.pitch < pa1.pitch) {
        return -1;
      } else {
        return 1;
      }
    }
  });
};

const pitchMap: Record<0 | 1 | 2 | 3 | 4 | 5 | 6, RootNote> = {
  0: "C",
  1: "D",
  2: "E",
  3: "F",
  4: "G",
  5: "A",
  6: "B",
};
export const convertPitchToRoot = (pitch: Pitch): RootNote => {
  // Pitch
  // -7 -> C2
  // -2 -> A2
  // -1 -> B3
  // 0 -> C4
  // 1 -> D4
  // 2 -> E4
  // 7 -> C5

  const mod: 0 | 1 | 2 | 3 | 4 | 5 | 6 = (((pitch % 7) + 7) % 7) as
    | 0
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6;
  return pitchMap[mod];
};
