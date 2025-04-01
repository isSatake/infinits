import { Clef, Pitch } from "@/core/types";
import { Path, UNIT, bClefC, bClefF, bClefG } from "@/font/bravura";

/**
 * 符頭のy座標を五線1間に対するスケールで返す
 * e.g.) ト音記号: F5=0, G4=3, C4=5 ヘ音記号: C4=-1, A3=0, F3=1
 */
export const pitchToYScale = (clef: Clef["pitch"], pitch: Pitch): number => {
  const c4y = clef === "g" ? 5.0 : clef === "f" ? -1 : 2;
  return c4y - pitch * 0.5;
};

export const getClefPath = (clef: Clef): { path: Path; y: number } => {
  const y =
    pitchToYScale(
      clef.pitch,
      clef.pitch === "g" ? 4 : clef.pitch === "f" ? -4 : 0
    ) * UNIT;
  const path =
    clef.pitch === "g" ? bClefG() : clef.pitch === "f" ? bClefF() : bClefC();
  return { path, y };
};
