import { staffMapAtom } from "@/state/atom";
import { StaffStyle } from "@/style/types";
import { useAtom } from "jotai";
import { useRef, useCallback } from "react";

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
