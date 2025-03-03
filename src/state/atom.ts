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

type FocusState = { staffId: number; idx: number };
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
const staffMapAtom = atom<Map<number, StaffStyle>>(new Map());
export const useStaffs = (): {
  map: Map<number, StaffStyle>;
  get: (id: number) => StaffStyle | undefined;
  add: (style: StaffStyle) => void;
  update: (id: number, fn: (style: StaffStyle) => StaffStyle) => void;
  remove: (id: number) => void;
} => {
  const [map, setMap] = useAtom(staffMapAtom);
  const idRef = useRef(0);
  const add = useCallback(
    (style: StaffStyle) => {
      map.set(idRef.current++, style);
      setMap(new Map(map));
    },
    [map]
  );
  const get = useCallback((id: number) => map.get(id), [map]);
  const update = useCallback(
    (id: number, fn: (style: StaffStyle) => StaffStyle) => {
      const style = map.get(id);
      if (style) {
        map.set(id, fn(style));
        setMap(new Map(map));
      }
    },
    [map]
  );
  const remove = useCallback(
    (id: number) => {
      map.delete(id);
      setMap(new Map(map));
    },
    [map]
  );
  return { map, add, get, update, remove };
};

export const contextMenuAtom = atom<
  | {
      htmlPoint: Point;
      staffId: number;
    }
  | undefined
>(undefined);

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
