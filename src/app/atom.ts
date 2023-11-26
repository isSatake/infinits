import { Point } from "@/org/geometry";
import { MusicalElement } from "@/org/notation/types";
import { StaffStyle } from "@/org/score-states";
import { atom } from "jotai";
import { kSampleElements } from "./constants";
import { CaretStyle } from "@/org/style/types";

// PreviewCanvasの表示
export type PreviewState = {
  canvasCenter: Point;
  staff: StaffStyle;
  elements: MusicalElement[];
  insertedIndex: number;
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
      insertedIndex:
        update.insertedIndex ?? get(previewAtom)?.insertedIndex ?? 0,
    });
  }
);

export const caretAtom = atom<{ staffId: number; idx: number }>({
  staffId: 0,
  idx: 0,
});
export const caretStyleAtom = atom<CaretStyle[]>([]);

// staff id -> last edited index
export const lastEditedAtom = atom<Map<number, number>>(new Map([[0, 0]]));

// staff id -> elements
export const elementsAtom = atom<Map<number, MusicalElement[]>>(
  new Map([[0, kSampleElements]])
);
