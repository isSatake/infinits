import { MusicalElement } from "@/core/types";
import { connectionAtom, elementsAtom, focusAtom } from "@/state/atom";
import { FileStyle } from "@/style/types";
import * as tone from "@/tone";
import { useAtomValue } from "jotai";
import { useObjects } from "./object";

export const usePlayTone = () => {
  const { map: rootObjs } = useObjects();
  const { rootObjId } = useAtomValue(focusAtom);
  const elementsMap = useAtomValue(elementsAtom);
  const connection = useAtomValue(connectionAtom);

  return () => {
    const fragments = new Map<
      number, // prevId
      Map<
        number, // startId
        { rootObjId: number; elements: (MusicalElement | FileStyle)[] }[] // currentId -> elements
      >
    >();
    const processedIds: number[] = [];
    const processId = (rootObjId: number) => {
      const obj = rootObjs.get(rootObjId);
      if (!obj) return;
      const elements: (MusicalElement | FileStyle)[] = [];
      if (obj?.type === "file") {
        elements.push(obj);
      }
      if (obj?.type === "staff") {
        elements.push(...(elementsMap.get(rootObjId) ?? []));
      }
      return { rootObjId, elements };
    };
    const searchFragments = (
      prevId: number,
      startId: number,
      currentId: number
    ) => {
      if (processedIds.includes(currentId)) return;
      processedIds.push(currentId);
      const elements = processId(currentId);
      if (!elements) return;
      const fragment = fragments.get(prevId) ?? new Map();
      fragment.set(startId, (fragment.get(startId) ?? []).concat(elements));
      fragments.set(prevId, fragment);
      const connectionIds = connection.get(currentId);
      if (!connectionIds) return;
      const [nextId, ...others] = connectionIds;
      searchFragments(prevId, startId, nextId);
      others.map((_id) => searchFragments(currentId, _id, _id));
    };
    searchFragments(-1, rootObjId, rootObjId);
    tone.multiPlay(fragments);
  };
};
