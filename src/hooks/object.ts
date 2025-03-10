import { rootObjMapAtom } from "@/state/atom";
import { RootObj } from "@/style/types";
import { useAtom } from "jotai";
import { useCallback, useRef } from "react";

export const useObjects = (): {
  map: Map<number, RootObj>;
  get: (id: number) => RootObj | undefined;
  add: (obj: RootObj) => void;
  update: (id: number, fn: (obj: RootObj) => RootObj) => void;
  remove: (id: number) => void;
} => {
  const [map, setMap] = useAtom(rootObjMapAtom);
  const idRef = useRef(0);
  const add = useCallback(
    (obj: RootObj) => {
      map.set(idRef.current++, obj);
      setMap(new Map(map));
    },
    [map]
  );
  const get = useCallback((id: number) => map.get(id), [map]);
  const update = useCallback(
    (id: number, fn: (obj: RootObj) => RootObj) => {
      const obj = map.get(id);
      if (obj) {
        map.set(id, fn(obj));
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
