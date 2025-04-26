import * as tone from "@/player/tone";
import {
  connectionsAtom,
  elementsAtom,
  focusAtom,
  rootObjIdConnectionsAtom,
  rootObjMapAtom,
} from "@/state/atom";
import { useAtomValue } from "jotai";
import { useObjIdMapAtom } from "./map-atom";

export const usePlayTone: () => () => void = () => {
  const { map: rootObjs } = useObjIdMapAtom(rootObjMapAtom);
  const { rootObjId } = useAtomValue(focusAtom);
  const elementsMap = useAtomValue(elementsAtom);
  const connections = useObjIdMapAtom(connectionsAtom);
  const rootObjIdConnections = useAtomValue(rootObjIdConnectionsAtom);

  const play = () => {
    const segmentsByPrevId = new Map<number, tone.PlaySegment[]>();
    const processedIds: number[] = [];
    const processId: (rootObjId: number) => tone.PlaySegment | undefined = (
      rootObjId: number
    ) => {
      const obj = rootObjs.get(rootObjId);
      if (!obj) return;
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
      const segment = segmentsByPrevId.get(prevId);
      segmentsByPrevId.set(prevId, (segment ?? []).concat(elements));
      const connectedRootObjIds = (rootObjIdConnections.get(currentId) ?? [])
        .map((id) => connections.get(id)?.to)
        .filter((id) => id !== undefined);
      const [nextId, ...others] = connectedRootObjIds;
      searchFragments(prevId, startId, nextId);
      others.map((_id) => searchFragments(currentId, _id, _id));
    };
    searchFragments(-1, rootObjId, rootObjId);
    tone.multiPlay(segmentsByPrevId);
  };
  return play;
};
