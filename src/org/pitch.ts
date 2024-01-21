import { PitchAcc } from "./notation/types";

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
