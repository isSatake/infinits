import { Clef, Pitch } from "@/core/types";
import { Path, UNIT, bClefC, bClefF, bClefG } from "@/font/bravura";

/**
 * 符頭のy座標を五線1間に対するスケールで返す
 * e.g.) ト音記号: F5(=10)→0, G4(=4)→3, C4(=0)→5 ヘ音記号: C4(=0)→-1, A3(-2)→0, F3(-4)→1
 */
export const pitchToYScale = (clef: Clef["pitch"], pitch: Pitch): number => {
  return c4YScale[clef] - pitch * 0.5;
};

/**
 * pitchToYScaleの逆関数
 * e.g.) ト音記号: 0→F5(=10), 3→G4(=4), 5→C4(=0) ヘ音記号: -1→C4(=0), 0→A3(=-2), 1→F3(=-4)
 */
export const yScaleToPitch = (clef: Clef["pitch"], y: number): Pitch => {
  return Math.round((c4YScale[clef] - y) * 2);
};

// clefそれぞれのC4の位置
const c4YScale = { G: 5.0, F: -1.0, C: 2.0 };

export const getClefPath = (clef: Clef): { path: Path; y: number } => {
  const y =
    pitchToYScale(
      clef.pitch,
      clef.pitch === "G" ? 4 : clef.pitch === "F" ? -4 : 0
    ) * UNIT;
  const path =
    clef.pitch === "G" ? bClefG() : clef.pitch === "F" ? bClefF() : bClefC();
  return { path, y };
};

export const pitchByDistance = (
  scale: number,
  dy: number,
  origin: Pitch
): Pitch => {
  const unitY = (UNIT / 2) * scale;
  return Math.round(dy / unitY + origin);
};
