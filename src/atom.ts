import { Point } from "@/org/geometry";
import { MusicalElement } from "@/org/notation/types";
import { CaretStyle } from "@/org/style/types";
import { atom, useAtom } from "jotai";
import { useCallback, useRef } from "react";
import { StaffStyle } from "./org/style/types";

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
