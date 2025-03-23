import { nextId } from "@/state/id";
import { useAtom } from "jotai";
import { PrimitiveAtom } from "jotai/vanilla";
import { useCallback } from "react";

export const useMapAtom = <T>(
  mapAtom: PrimitiveAtom<Map<number, T>>
): {
  map: Map<number, T>;
  get: (id: number) => T | undefined;
  add: (obj: T) => number;
  update: (id: number, fn: (obj: T) => T) => void;
  remove: (id: number) => void;
} => {
  const [map, setMap] = useAtom(mapAtom);
  const add = (obj: T) => {
    const id = nextId();
    map.set(id, obj);
    setMap(new Map(map));
    return id;
  };
  const get = useCallback((id: number) => map.get(id), [map]);
  const update = useCallback(
    (id: number, fn: (obj: T) => T) => {
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
