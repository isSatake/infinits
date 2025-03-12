import { MusicalElement } from "@/core/types";
import {
  elementsAtom,
  focusAtom,
  rootObjMapAtom,
  connectionAtom,
} from "@/state/atom";
import { FileStyle } from "@/style/types";
import * as tone from "@/tone";
import { useAtomValue } from "jotai";

export const usePlayTone = () => {
  const rootObjs = useAtomValue(rootObjMapAtom);
  const { rootObjId } = useAtomValue(focusAtom);
  const elementsMap = useAtomValue(elementsAtom);
  const connection = useAtomValue(connectionAtom);
  const connectedIds: number[] = [];
  let id: number | undefined = rootObjId;
  const elements: (MusicalElement | FileStyle)[] = [];
  while (id !== undefined && !connectedIds.includes(id)) {
    const obj = rootObjs.get(id);
    if (obj?.type === "file") {
      elements.push(obj);
    } else if (obj?.type === "staff") {
      elements.push(...(elementsMap.get(id) ?? []));
    }
    connectedIds.push(id);
    id = connection.get(id);
  }
  return () => tone.play(elements);
};
