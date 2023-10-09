import { Point } from "@/org/geometry";
import { atom } from "jotai";

// PreviewCanvasの表示
export type PreviewState = {
  center: Point;
};
export const previewAtom = atom<PreviewState | undefined>(undefined);
