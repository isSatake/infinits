import { accidentalModeIdxAtom } from "@/atom";
import { kAccidentalModes } from "@/org/input-modes";
import { atom, useAtom } from "jotai";

export const useAccidentalMode = () => {
  const [idx, setIdx] = useAtom(accidentalModeIdxAtom);
  return {
    accidentalMode: kAccidentalModes[idx],
    changeAccidentalMode: () => {
      const nextIdx = (idx + 1) % 4;
      setIdx(nextIdx);
    },
  };
};
