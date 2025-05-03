import { kAccidentalModes } from "@/input";
import { uiAtom } from "@/state/atom";
import { useAtom } from "jotai";

export const useAccidentalMode = () => {
  const [idx, setIdx] = useAtom(uiAtom.accidentalModeIdx);
  return {
    accidentalMode: kAccidentalModes[idx],
    changeAccidentalMode: () => {
      const nextIdx = (idx + 1) % 4;
      setIdx(nextIdx);
    },
  };
};
