import { Clef, Pitch } from "@/core/types";
import { Path, UNIT, bClefC, bClefF, bClefG } from "@/font/bravura";

/**
 * middleC(C4)=0としたときのy座標を符頭の五線1間に対するスケールで返す
 */
export const pitchToYScale = (clef: Clef["pitch"], pitch: Pitch): number => {
  const c4y = clef === "g" ? 5.0 : clef === "f" ? -1 : 2;
  return c4y - pitch * 0.5;
};

export const getClefPath = (clef: Clef): { path: Path; y: number } => {
  const y = pitchToYScale(clef.pitch, 4) * UNIT;
  const path =
    clef.pitch === "g" ? bClefG() : clef.pitch === "f" ? bClefF() : bClefC();
  return { path, y };
};
