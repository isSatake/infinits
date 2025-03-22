import { ChordRoot, Duration, MusicalElement } from "@/core/types";
import { Point } from "@/lib/geometry";
import { CaretStyle } from "@/layout/types";
import { atom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { StaffStyle } from "../layout/types";
import { RootObj } from "@/object";

// PreviewCanvasの表示
export type PreviewState = {
  canvasCenter: Point;
  staff: StaffStyle;
  elements: MusicalElement[];
  insertedIndex: number;
  offsetted: boolean;
};
export const previewAtom = atom<PreviewState | undefined>(undefined);

export type FocusState = { rootObjId: number; idx: number };
export const focusAtom = atom<FocusState>({ rootObjId: 0, idx: 0 });
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
export const elementsAtom = atom<Map<number, MusicalElement[]>>(new Map());

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
