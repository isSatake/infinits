import { MusicalElement } from "@/core/types";
import {
  connectionsAtom,
  elementsAtom,
  focusAtom,
  rootObjIdConnectionsAtom,
  rootObjMapAtom,
} from "@/state/atom";
import { FileStyle } from "@/layout/types";
import * as tone from "@/player/tone";
import { useAtomValue } from "jotai";
import { useObjIdMapAtom } from "./map-atom";

export const usePlayTone = () => {
  const { map: rootObjs } = useObjIdMapAtom(rootObjMapAtom);
  const { rootObjId } = useAtomValue(focusAtom);
  const elementsMap = useAtomValue(elementsAtom);
  const connections = useObjIdMapAtom(connectionsAtom);
  const rootObjIdConnections = useAtomValue(rootObjIdConnectionsAtom);

  return () => {
    const fragments = new Map<
      number, // prevId
      Map<
        number, // startId
        tone.PlayFragment[] // currentId -> elements
      >
    >();
    const processedIds: number[] = [];
    const processId = (rootObjId: number) => {
      const obj = rootObjs.get(rootObjId);
      if (!obj) return;
      const elements: (MusicalElement | FileStyle)[] = [];
      if (obj?.type === "file") {
        return { type: "file", rootObjId, element: obj };
      }
      if (obj?.type === "staff") {
        return {
          type: "staff",
          rootObjId,
          keySig: obj.staff.keySignature,
          elements: elementsMap.get(rootObjId) ?? [],
        };
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
      const connectedRootObjIds = (rootObjIdConnections.get(currentId) ?? [])
        .map((id) => connections.get(id)?.to)
        .filter((id) => id !== undefined);
      const [nextId, ...others] = connectedRootObjIds;
      searchFragments(prevId, startId, nextId);
      others.map((_id) => searchFragments(currentId, _id, _id));
    };
    searchFragments(-1, rootObjId, rootObjId);
    tone.multiPlay(fragments);
  };
};
