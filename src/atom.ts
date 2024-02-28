import { Point } from "@/org/geometry";
import { MusicalElement } from "@/org/notation/types";
import { StaffStyle } from "./org/style/types";
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

export const caretAtom = atom<{ staffId: number; idx: number }>({
  staffId: 0,
  idx: 0,
});
export const caretStyleAtom = atom<CaretStyle[]>([]);

// staff id -> elements
export const elementsAtom = atom<Map<number, MusicalElement[]>>(
  new Map([[0, kSampleElements]])
);
