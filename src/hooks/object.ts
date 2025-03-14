import { rootObjMapAtom } from "@/state/atom";
import { RootObj } from "@/style/types";
import { useAtom } from "jotai";
import { useCallback } from "react";

let id = 8;

export const useObjects = (): {
  map: Map<number, RootObj>;
  get: (id: number) => RootObj | undefined;
  add: (obj: RootObj) => void;
  update: (id: number, fn: (obj: RootObj) => RootObj) => void;
  remove: (id: number) => void;
} => {
  const [map, setMap] = useAtom(rootObjMapAtom);
  const add = (obj: RootObj) => {
    map.set(id++, obj);
    setMap(new Map(map));
  };
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
