import { Point } from "@/org/geometry";
import { MusicalElement } from "@/org/notation/types";
import { StaffStyle } from "@/org/score-states";
import { atom } from "jotai";

// PreviewCanvasの表示
export type PreviewState = {
  canvasCenter: Point;
  staff: StaffStyle;
  elements: MusicalElement[];
};
export const previewAtom = atom<PreviewState | undefined>(undefined);
// canvasCenter以外の値をPATCHできるatom
export const previewSetterAtom = atom(
  (get) => get(previewAtom),
  (
    get,
    set,
    update: ({ canvasCenter: Point } & Partial<PreviewState>) | undefined
  ) => {
    if (update === undefined) {
      set(previewAtom, undefined);
      return;
    }
    set(previewAtom, {
      ...update,
      canvasCenter: update.canvasCenter,
      staff: update.staff ??
        get(previewAtom)?.staff ?? {
          clef: { type: "g" as const },
          position: { x: 0, y: 0 },
        },
      elements: update.elements ?? get(previewAtom)?.elements ?? [],
    });
  }
);

export const focusAtom = atom<{ staffId: number; idx: number }>({
  staffId: 0,
  idx: 0,
});
