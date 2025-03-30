import { MusicalElement } from "@/core/types";
import {
  connectionAtom,
  staffElementsMapAtom,
  focusAtom,
  rootObjMapAtom,
  staffObjMapAtom,
} from "@/state/atom";
import { FileStyle } from "@/layout/types";
import * as tone from "@/tone";
import { useAtomValue } from "jotai";
import { useObjMapAtom } from "./root-obj";

export const usePlayTone = () => {
  const { map: rootObjs } = useObjMapAtom(rootObjMapAtom);
  const focus = useAtomValue(focusAtom);
  const { map: staffs } = useObjMapAtom(staffObjMapAtom);
  const elementsMap = useAtomValue(staffElementsMapAtom);
  const connection = useAtomValue(connectionAtom);

  return () => {
    if (!focus) return;
    const fragments = new Map<
      number, // prevId
      Map<
        number, // startId
        { objId: number; elements: (MusicalElement | FileStyle)[] }[] // currentId -> elements
      >
    >();
    const processedIds: number[] = [];
    const processId = (id: number, type: "file" | "staff") => {
      const obj = type === "file" ? rootObjs.get(id) : staffs.get(id);
      if (!obj) return;
      const elements: (MusicalElement | FileStyle)[] = [];
      if (obj?.type === "file") {
        elements.push(obj);
      }
      if (obj?.type === "staff") {
        elements.push(...(elementsMap.get(id) ?? []));
      }
      return { id, elements };
    };
    const searchFragments = (
      prevId: number,
      startId: number,
      current: { type: "file" | "staff"; id: number }
    ) => {
      if (processedIds.includes(current.id)) return;
      processedIds.push(current.id);
      const elements = processId(currentId);
      if (!elements) return;
      const fragment = fragments.get(prevId) ?? new Map();
      fragment.set(startId, (fragment.get(startId) ?? []).concat(elements));
      fragments.set(prevId, fragment);
      const connectionIds = connection.get(current.id);
      if (!connectionIds) return;
      const [nextId, ...others] = connectionIds;
      searchFragments(prevId, startId, nextId);
      others.map((_id) => searchFragments(current.id, _id, _id));
    };
    searchFragments(-1, focus.objId, focus.objId);
    tone.multiPlay(fragments);
  };
};
