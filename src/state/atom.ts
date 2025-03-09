import { Point } from "@/lib/geometry";
import { ChordRoot, Duration, MusicalElement } from "@/core/types";
import { CaretStyle } from "@/style/types";
import { atom, useAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import { StaffStyle } from "../style/types";

// PreviewCanvasの表示
export type PreviewState = {
  canvasCenter: Point;
  staff: StaffStyle;
  elements: MusicalElement[];
  insertedIndex: number;
  offsetted: boolean;
};
export const previewAtom = atom<PreviewState | undefined>(undefined);

export type FocusState = { staffId: number; idx: number };
export const focusAtom = atom<FocusState>({ staffId: 0, idx: 0 });
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
export const elementsAtom = atom<Map<number, MusicalElement[]>>(
  new Map([[0, []]])
);

// staff id -> staff style
export const staffMapAtom = atom<Map<number, StaffStyle>>(new Map());

export const staffConnectionAtom = atom<Map<number, number>>(new Map([[0, 1]]));

export const uncommitedStaffConnectionAtom = atom<
  { from: number; position: Point } | undefined
>(undefined);

export type ContextMenu = {
  htmlPoint: Point;
} & ({ type: "staff"; staffId: number } | { type: "canvas" });
export const contextMenuAtom = atom<ContextMenu | undefined>(undefined);

export const showDialogAtom = atom<
  | {
      title: string;
      buttons?: { label: string; onClick: () => void }[];
    }
  | undefined
>(undefined);

export const accidentalModeIdxAtom = atom<number>(0);

export type ChordSelection = { duration: Duration; root?: ChordRoot };
export const chordSelectionAtom = atom<ChordSelection | undefined>(undefined);

export type NoteInputMode = "note" | "rest" | "chord";
export const noteInputModeAtom = atom<NoteInputMode>("note");

export type BeamModes = "beam" | "nobeam";
export const beamModeAtom = atom<BeamModes>("nobeam");

export type TieModes = "tie" | "notie";
export const tieModeAtom = atom<TieModes>("notie");
