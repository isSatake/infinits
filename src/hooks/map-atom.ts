import { useAtom } from "jotai";
import { PrimitiveAtom } from "jotai/vanilla";
import { useCallback } from "react";

let id = 0;

export const useMapAtom = <T>(
  atom: PrimitiveAtom<Map<number, T>>
): {
  map: Map<number, T>;
  get: (id: number) => T | undefined;
  add: (obj: T) => void;
  update: (id: number, fn: (obj: T) => T) => void;
  remove: (id: number) => void;
} => {
  const [map, setMap] = useAtom(atom);
  const add = (obj: T) => {
    map.set(id++, obj);
    setMap(new Map(map));
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
