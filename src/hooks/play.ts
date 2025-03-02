import { elementsAtom, focusAtom } from "@/atom";
import * as tone from "@/tone";

import { useAtomValue } from "jotai";
import { useCallback } from "react";
export const usePlayTone = () => {
  const elements = useAtomValue(elementsAtom);
  const { staffId } = useAtomValue(focusAtom);
  return useCallback(
    () => tone.play(elements.get(staffId) ?? []),
    [elements, staffId]
  );
};
