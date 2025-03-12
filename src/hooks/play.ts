import { MusicalElement } from "@/core/types";
import {
  elementsAtom,
  focusAtom,
  rootObjMapAtom,
  connectionAtom,
} from "@/state/atom";
import * as tone from "@/tone";
import { useAtomValue } from "jotai";

export const usePlayTone = () => {
  const rootObjs = useAtomValue(rootObjMapAtom);
  const { rootObjId } = useAtomValue(focusAtom);
  const elementsMap = useAtomValue(elementsAtom);
  const connection = useAtomValue(connectionAtom);
  let id: number | undefined = rootObjId;
  const elements: (MusicalElement | File)[] = [];
  while (id !== undefined) {
    const obj = rootObjs.get(id);
    if (obj?.type === "file") {
      elements.push(obj.file);
    } else if (obj?.type === "staff") {
      elements.push(...(elementsMap.get(id) ?? []));
    }
    id = connection.get(id);
  }
  return () => tone.play(elements);
};
