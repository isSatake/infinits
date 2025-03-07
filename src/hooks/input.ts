import { sortPitches } from "@/core/pitch";
import { connectTie, inputMusicalElement } from "@/core/score-updater";
import { Duration, PitchAcc, MusicalElement, Pitch } from "@/core/types";
import { kAccidentalModes } from "@/input";
import {
  focusAtom,
  elementsAtom,
  PreviewState,
  caretStyleAtom,
  previewAtom,
  accidentalModeIdxAtom,
  NoteInputMode,
  noteInputModeAtom,
  beamModeAtom,
  tieModeAtom,
  TieModes,
  FocusState,
} from "@/state/atom";
import { getPreviewScale, getPreviewWidth } from "@/style/score-preferences";
import { useAtomValue, useAtom } from "jotai";
import { useCallback, useMemo, useRef } from "react";
import { usePointerHandler } from "./hooks";
import * as bravura from "@/font/bravura";
import * as tone from "@/tone";
import { useStaffs } from "./staff";

const composeNewElement = (p: {
  mode: NoteInputMode;
  duration: Duration;
  pitches: PitchAcc[];
}): MusicalElement => {
  const { mode, pitches, duration } = p;
  return mode === "rest"
    ? { type: "rest", duration }
    : { type: "note", pitches, duration };
};

// 和音をソート
const useSortChord: () => (newEl: MusicalElement) => MusicalElement = () => {
  const caret = useAtomValue(focusAtom);
  const baseElements = useBaseElements();
  return useCallback(
    (newEl: MusicalElement) => {
      const ret = { ...newEl };
      if (caret.idx > 0 && caret.idx % 2 !== 0) {
        const idx = caret.idx === 1 ? 0 : (caret.idx - 1) / 2;
        const currentEl = baseElements[idx];
        if (
          ret.type === "note" &&
          currentEl.type === "note" &&
          ret.duration === currentEl.duration
        ) {
          ret.pitches = sortPitches([...currentEl.pitches, ...ret.pitches]);
        }
      }
      return ret;
    },
    [caret.idx, baseElements]
  );
};

export const useBaseElements = () => {
  const elements = useAtomValue(elementsAtom);
  const caret = useAtomValue(focusAtom);
  return useMemo(
    () => [...(elements.get(caret.staffId) ?? [])],
    [elements, caret.staffId]
  );
};

const tiee = (
  tieMode: TieModes,
  p: {
    newElement: MusicalElement;
    elements: MusicalElement[];
  }
) => {
  if (tieMode === "tie") {
    return connectTie(p);
  }
  return p;
};

export const useElementsComposer: (duration: Duration) => (
  newPitches: PitchAcc[],
  position?: "left" | "right"
) => Pick<PreviewState, "elements" | "insertedIndex" | "offsetted"> & {
  caretAdvance: number;
} = (duration: Duration) => {
  const caret = useAtomValue(focusAtom);
  const caretStyle = useAtomValue(caretStyleAtom);
  const baseElements = useBaseElements();
  const inputMode = useAtomValue(noteInputModeAtom);
  const beamMode = useAtomValue(beamModeAtom);
  const tieMode = useAtomValue(tieModeAtom);
  const sortChord = useSortChord();
  return useCallback(
    (newPitches: PitchAcc[], position?: "left" | "right") => {
      const newEl = composeNewElement({
        mode: inputMode,
        pitches: newPitches,
        duration,
      });
      const { newElement: _newEl, elements } = tiee(tieMode, {
        newElement: newEl,
        elements: baseElements,
      });
      const newElement = sortChord(_newEl);
      let offset = 0;
      if (position) {
        if (position === "left" && caret.idx > 0) {
          offset = -1;
        } else if (
          position === "right" &&
          caretStyle[caret.idx].elIdx < elements.length
        ) {
          offset = 1;
        }
      }
      const ret = inputMusicalElement({
        caretIndex: caret.idx + offset,
        elements,
        newElement,
        beamMode,
      });
      return {
        ...ret,
        caretAdvance: ret.caretAdvance + offset,
        offsetted: offset !== 0,
      };
    },
    [caret.idx, baseElements, inputMode, beamMode, duration]
  );
};

export const usePreviewHandlers = (duration: Duration) => {
  const [preview, setPreview] = useAtom(previewAtom);
  const accidental = kAccidentalModes[useAtomValue(accidentalModeIdxAtom)];
  const composeElements = useElementsComposer(duration);
  const [caret, setCaret] = useAtom(focusAtom);
  const [elMap, setElements] = useAtom(elementsAtom);
  const staff = useStaffs().get(caret.staffId);
  const positionRef = useRef<"left" | "right" | undefined>();

  return usePointerHandler({
    onLongDown: (ev) => {
      if (!staff) {
        return;
      }
      const newPitch = {
        pitch: pitchByDistance(getPreviewScale(), 0, 6),
        accidental,
      };
      setPreview({
        canvasCenter: { x: ev.clientX, y: ev.clientY },
        staff: { ...staff, position: { x: 0, y: 0 } },
        ...composeElements([newPitch]),
      });
    },
    onUp: (ev, down) => {
      setPreview(undefined);
      const dy = down.clientY - ev.clientY;
      const newPitch = {
        pitch: pitchByDistance(getPreviewScale(), dy, 6),
        accidental,
      };
      const { elements, insertedIndex, caretAdvance } = composeElements(
        [newPitch],
        positionRef.current
      );
      setCaret({ ...caret, idx: caret.idx + caretAdvance });
      setElements(new Map(elMap).set(caret.staffId, elements));
      // 入力時のプレビューは8分音符固定
      tone.play([elements[insertedIndex]], 8);
    },
    onDrag: (ev, down) => {
      if (!preview || !staff) {
        return;
      }
      const dy = down.clientY - ev.clientY;
      const newPitch = {
        pitch: pitchByDistance(getPreviewScale(), dy, 6),
        accidental,
      };
      const { canvasCenter } = preview;
      const canvasLeft = canvasCenter.x - getPreviewWidth() / 2;
      const leftBound = canvasLeft + getPreviewWidth() / 3;
      const rightBound = canvasLeft + (getPreviewWidth() / 3) * 2;
      if (ev.clientX < leftBound) {
        positionRef.current = "left";
      } else if (ev.clientX > rightBound) {
        positionRef.current = "right";
      } else {
        positionRef.current = undefined;
      }
      setPreview({
        ...preview,
        ...composeElements([newPitch], positionRef.current),
      });
    },
  });
};

const pitchByDistance = (scale: number, dy: number, origin: Pitch): Pitch => {
  const unitY = (bravura.UNIT / 2) * scale;
  return Math.round(dy / unitY + origin);
};
