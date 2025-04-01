import { Clef, Pitch } from "@/core/types";

export const pitchToYScale = (clef: Clef["pitch"], pitch: Pitch): number => {
  // middleC(C4)=0とする
  // y原点は符頭の中心(音程を示す高さ)
  const halfOfNoteHeadHeightScale = 0.5;
  if (clef === "g") {
    const c4y = 4.5 + halfOfNoteHeadHeightScale;
    return c4y - pitch * halfOfNoteHeadHeightScale;
  } else if (clef === "f") {
    const c4y = 2.5 + halfOfNoteHeadHeightScale;
    return c4y - pitch * halfOfNoteHeadHeightScale;
  } else {
    const c4y = 3.5 + halfOfNoteHeadHeightScale;
    return c4y - pitch * halfOfNoteHeadHeightScale;
  }
};
