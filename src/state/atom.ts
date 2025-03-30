import { ChordRoot, Duration, MusicalElement } from "@/core/types";
import { BBox, Point } from "@/lib/geometry";
import {
  CaretStyle,
  PaintNode,
  PaintNodeMap,
  Pointing,
  RootPaintNodeType,
} from "@/layout/types";
import { atom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { RootObj, StaffObject } from "@/object";
import { getInitScale } from "@/layout/score-preferences";

// PreviewCanvasの表示
export type PreviewState = {
  canvasCenter: Point;
  staff: StaffStyle;
  elements: MusicalElement[];
  insertedIndex: number;
  offsetted: boolean;
};
export const previewAtom = atom<PreviewState | undefined>(undefined);

export type FocusState = {
  objType: "staff" | "text" | "file";
  objId: number;
  idx: number;
};
export const focusAtom = atom<FocusState | undefined>(undefined);
export const useFocusHighlighted = (focus: FocusState): boolean => {
  const [highlighted, setHighlighted] = useState<boolean>(true);
  const blinkTimerRef = useRef<number | null>(null);
  useEffect(() => {
    setHighlighted(true);
    blinkTimerRef.current = window.setInterval(() => {
      setHighlighted((prev) => !prev);
    }, 800);
    return () => window.clearInterval(blinkTimerRef.current!);
  }, [focus]);
  return highlighted;
};

export const caretStyleAtom = atom<CaretStyle[]>([]);

// staff id -> elements
export const staffElementsMapAtom = atom<Map<number, MusicalElement[]>>(
  new Map()
);

// staff id -> staff obj
export const staffObjMapAtom = atom<Map<number, StaffObject>>(new Map());

// score id -> staff ids
export const scoreStaffMapAtom = atom<Map<number, number[]>>(new Map());

export const connectionAtom = atom<Map<number, number[]>>(new Map());

export const uncommitedStaffConnectionAtom = atom<
  { from: number; position: Point } | undefined
>(undefined);

export type ContextMenu = {
  htmlPoint: Point;
} & (
  | { type: "staff"; staffId: number }
  | { type: "canvas"; desktopPoint: Point }
);
export const contextMenuAtom = atom<ContextMenu | undefined>(undefined);

export type DialogState =
  | {
      type: "message";
      title: string;
      buttons: { label: string; onClick: () => void }[];
    }
  | {
      type: "input";
      placeholder: string;
      buttons: { label: string; onClick: (value: string) => void }[];
    };
export const showDialogAtom = atom<DialogState | undefined>(undefined);

export const accidentalModeIdxAtom = atom<number>(0);

export type ChordSelection = { duration: Duration; root?: ChordRoot };
export const chordSelectionAtom = atom<ChordSelection | undefined>(undefined);

export type NoteInputMode = "note" | "rest" | "chord";
export const noteInputModeAtom = atom<NoteInputMode>("note");

export type BeamModes = "beam" | "nobeam";
export const beamModeAtom = atom<BeamModes>("nobeam");

export type TieModes = "tie" | "notie";
export const tieModeAtom = atom<TieModes>("notie");

export const rootObjMapAtom = atom<Map<number, RootObj>>(new Map());

// obj id -> paint node
export const rootPaintNodeMapAtom = atom<
  Map<number, PaintNodeMap[RootPaintNodeType]>
>(new Map());

export const pointingAtom = atom<Pointing | undefined>(undefined);

export const mtxAtom = atom<DOMMatrix>(
  new DOMMatrix([getInitScale(), 0, 0, getInitScale(), 0, 0])
);
