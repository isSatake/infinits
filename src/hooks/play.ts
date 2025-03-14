import { MusicalElement } from "@/core/types";
import {
  connectionAtom,
  elementsAtom,
  focusAtom,
  rootObjMapAtom,
} from "@/state/atom";
import { FileStyle } from "@/style/types";
import * as tone from "@/tone";
import { useAtomValue } from "jotai";

export const usePlayTone = () => {
  const rootObjs = useAtomValue(rootObjMapAtom);
  const { rootObjId } = useAtomValue(focusAtom);
  const elementsMap = useAtomValue(elementsAtom);
  const connection = useAtomValue(connectionAtom);

  return () => {
    // 0 - 1 - 2
    //     \ - 3
    // -> [[-1, { elements: [0, 1, 2]}], [1, { elements: [3]}]]
    const fragments = new Map<
      number,
      { rootObjId: number; elements: (MusicalElement | FileStyle)[] }[]
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
    const searchFragments = (prevId: number, currentId: number) => {
      if (processedIds.includes(currentId)) return;
      processedIds.push(currentId);
      const elements = processId(currentId);
      if (!elements) return;
      fragments.set(prevId, (fragments.get(prevId) ?? []).concat(elements));
      const connectionIds = connection.get(currentId);
      if (!connectionIds) return;
      const [nextId, ...others] = connectionIds;
      searchFragments(prevId, nextId);
      others.map((_id) => searchFragments(currentId, _id));
    };
    searchFragments(-1, rootObjId);
    tone.multiPlay(fragments);
  };
};
