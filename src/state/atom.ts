import { Clef, KeySignature, MusicalElement } from "@/core/types";
import { CaretStyle } from "@/layout/types";
import { atom } from "jotai";
import { useEffect, useRef, useState } from "react";
import {
  BeamModes,
  ChordSelection,
  ContextMenu,
  DialogState,
  FocusState,
  NoteInputMode,
  PreviewState,
  TieModes,
} from "./types";
import { Point } from "@/lib/geometry";
import { RootObj } from "@/object";
import { CaretLayout } from "@/layout/new/types";

export const objectAtom = {
  rootObjMap: atom<Map<number, RootObj>>(new Map()),
  // root obj (=staff) id -> elements
  elements: atom<Map<number, MusicalElement[]>>(new Map()),
  connections: atom<Map<number, { from: number; to: number }>>(new Map()),
  rootObjIdConnections: atom<Map<number, number[]>>(new Map()),
  uncommitedStaffConnection: atom<
    { from: number; toPosition: Point } | undefined
  >(undefined),
};

export const uiAtom = {
  preview: atom<PreviewState | undefined>(undefined),
  focus: atom<FocusState>({ rootObjId: 0, idx: 0 }),
  caretStyle: atom<CaretStyle[]>([]),
  caretLayout: atom<CaretLayout[]>([]),
  contextMenu: atom<ContextMenu | undefined>(undefined),
  showDialog: atom<DialogState | undefined>(undefined),
  accidentalModeIdx: atom<number>(0),
  chordSelection: atom<ChordSelection | undefined>(undefined),
  noteInputMode: atom<NoteInputMode>("note"),
  beamMode: atom<BeamModes>("nobeam"),
  tieMode: atom<TieModes>("notie"),
  lastKeySig: atom<KeySignature | undefined>(undefined),
  lastClef: atom<Clef | undefined>(undefined),
};

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
