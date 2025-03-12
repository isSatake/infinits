import { elementsAtom, focusAtom, rootObjMapAtom } from "@/state/atom";
import * as tone from "@/tone";
import { useAtomValue } from "jotai";

export const usePlayTone = () => {
  const rootObjs = useAtomValue(rootObjMapAtom);
  const { rootObjId } = useAtomValue(focusAtom);
  const elements = useAtomValue(elementsAtom);
  const obj = rootObjs.get(rootObjId);
  if (obj?.type === "text" || !obj?.type) {
    return;
  }
  return () =>
    tone.play(obj.type === "file" ? [obj.file] : elements.get(rootObjId) ?? []);
};
