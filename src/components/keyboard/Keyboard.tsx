import { sortPitches } from "@/core/pitch";
import {
  BarTypes,
  Duration,
  MusicalElement,
  Pitch,
  PitchAcc,
} from "@/core/types";
import { useAccidentalMode } from "@/hooks/accidental";
import * as bravura from "@/font/bravura";
import { BeamModes, kAccidentalModes, TieModes } from "@/input";
import { getPreviewScale, getPreviewWidth } from "@/style/score-preferences";
import { inputMusicalElement } from "@/core/score-updater";
import * as tone from "@/tone";
import { atom, useAtom, useAtomValue } from "jotai";
import React, { FC, useCallback, useMemo, useRef, useState } from "react";
import {
  accidentalModeIdxAtom,
  caretStyleAtom,
  chordSelectionAtom,
  elementsAtom,
  focusAtom,
  previewAtom,
  PreviewState,
  useStaffs,
} from "../../state/atom";
import { usePointerHandler } from "../../hooks/hooks";
import { ChordSelector } from "./chord";
import { PlayButton } from "./PlayButton";

export const Keyboard = () => {
  const inputMode = useAtomValue(noteInputModeAtom);
  const chordSelection = useAtomValue(chordSelectionAtom);
  return (
    <div className="keyboard">
      <div className="keyHeader">
        {chordSelection ? <ChordSelector /> : <PlayButton />}
      </div>
      <div className="keyContainer">
        <KeyRow>
          <InputModeSwitcher />
          {inputMode === "chord" ? (
            <>
              <ChordKey duration={1} />
              <ChordKey duration={2} />
              <ChordKey duration={4} />
            </>
          ) : (
            <>
              <NoteKey duration={1} />
              <NoteKey duration={2} />
              <NoteKey duration={4} />
            </>
          )}
          <Backspace />
        </KeyRow>
        <KeyRow>
          <ArrowLeft />
          {inputMode === "chord" ? (
            <>
              <FlagChordKey duration={8} />
              <FlagChordKey duration={16} />
              <FlagChordKey duration={32} />
            </>
          ) : (
            <>
              <FlagNoteKey duration={8} />
              <FlagNoteKey duration={16} />
              <FlagNoteKey duration={32} />
            </>
          )}
          <ArrowRight />
        </KeyRow>
        <KeyRow>
          <BeamToggle />
          <WhiteKey />
          <Dynamics />
          <Bars />
          <Return />
        </KeyRow>
        <KeyRow>
          <Accidentals />
          <Slur />
          <Accent />
          <Fermata />
          <Tie />
        </KeyRow>
      </div>
    </div>
  );
};

type NoteInputMode = "note" | "rest" | "chord";
const noteInputModeAtom = atom<NoteInputMode>("note");

const InputModeSwitcher = () => {
  const [noteInputMode, setNoteInputMode] = useAtom(noteInputModeAtom);
  const modes: NoteInputMode[] = ["note", "rest", "chord"];

  const toggleNoteInputMode = () => {
    const currentIndex = modes.indexOf(noteInputMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setNoteInputMode(modes[nextIndex]);
  };

  return (
    <>
      <GrayKey onClick={toggleNoteInputMode}>
        <div className={`keyImg changeInputMode ${noteInputMode}`} />
      </GrayKey>
    </>
  );
};

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

const tieAtom = atom<TieModes>(undefined);

// タイの整合を取る
const useTie: () => (newEl: MusicalElement) => MusicalElement = () => {
  const tieMode = useAtomValue(tieAtom);
  const caret = useAtomValue(focusAtom);
  const baseElements = useBaseElements();
  return useCallback(
    (newEl: MusicalElement) => {
      const ret = { ...newEl };
      if (
        ret.type === "note" &&
        !!tieMode &&
        caret.idx > 0 &&
        caret.idx % 2 === 0
      ) {
        const prevEl = baseElements[caret.idx / 2 - 1];
        if (
          prevEl.type === "note" &&
          prevEl.pitches[0].pitch === ret.pitches[0].pitch &&
          prevEl.pitches[0].accidental === ret.pitches[0].accidental
        ) {
          prevEl.tie = "start";
          ret.tie = "stop";
        }
      }
      return ret;
    },
    [tieMode, caret.idx, baseElements]
  );
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

const useBaseElements = () => {
  const elements = useAtomValue(elementsAtom);
  const caret = useAtomValue(focusAtom);
  return useMemo(
    () => [...(elements.get(caret.staffId) ?? [])],
    [elements, caret.staffId]
  );
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
  const tietie = useTie();
  const sortChord = useSortChord();
  return useCallback(
    (newPitches: PitchAcc[], position?: "left" | "right") => {
      const _ne = composeNewElement({
        mode: inputMode,
        pitches: newPitches,
        duration,
      });
      const ne = tietie(_ne);
      const newElement = sortChord(ne);
      let offset = 0;
      if (position) {
        if (position === "left" && caret.idx > 0) {
          offset = -1;
        } else if (
          position === "right" &&
          caretStyle[caret.idx].elIdx < baseElements.length
        ) {
          offset = 1;
        }
      }
      const ret = inputMusicalElement({
        caretIndex: caret.idx + offset,
        elements: baseElements,
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

const usePreviewHandlers = (duration: Duration) => {
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

const NoteKey: FC<{ duration: 1 | 2 | 4 }> = ({ duration }) => {
  const noteInputMode = useAtomValue(noteInputModeAtom);
  const previewHandlers = usePreviewHandlers(duration);
  return (
    <WhiteKey {...previewHandlers}>
      <div className={`keyImg d${duration} ${noteInputMode}`} />
    </WhiteKey>
  );
};

const ChordKey: FC<{ duration: 1 | 2 | 4 }> = ({ duration }) => {
  const [rootSelector, setRootSelector] = useAtom(chordSelectionAtom);
  return (
    <WhiteKey
      isActive={rootSelector?.duration === duration}
      onClick={() => setRootSelector(rootSelector ? undefined : { duration })}
    >
      <div
        className={`keyImg d${duration} chord ${rootSelector ? "active" : ""}`}
      />
    </WhiteKey>
  );
};

const FlagNoteKey: FC<{ duration: 8 | 16 | 32 }> = ({ duration }) => {
  const noteInputMode = useAtomValue(noteInputModeAtom);
  const beamMode = useAtomValue(beamModeAtom);
  const previewHandlers = usePreviewHandlers(duration);
  return (
    <WhiteKey {...previewHandlers}>
      <div className={`keyImg d${duration} ${noteInputMode} ${beamMode}`} />
    </WhiteKey>
  );
};

const FlagChordKey: FC<{ duration: 8 | 16 | 32 }> = ({ duration }) => {
  const [rootSelector, setRootSelector] = useAtom(chordSelectionAtom);
  const beamMode = useAtomValue(beamModeAtom);
  return (
    <WhiteKey
      isActive={rootSelector?.duration === duration}
      onClick={() => setRootSelector(rootSelector ? undefined : { duration })}
    >
      <div className={`keyImg d${duration} chord ${beamMode}`} />
    </WhiteKey>
  );
};

const Backspace = () => {
  const [caret, setCaret] = useAtom(focusAtom);
  const caretStyle = useAtomValue(caretStyleAtom);
  const [elMap, setElements] = useAtom(elementsAtom);
  return (
    <GrayKey
      onClick={() => {
        const targetElIdx = caretStyle[caret.idx].elIdx;
        const elements = elMap.get(caret.staffId);
        if (!elements || elements.length === 0) {
          return;
        }
        const deleted = elements.splice(targetElIdx, 1)[0];
        if (deleted.type === "note") {
          // beamの整合を取る
          const left = elements[targetElIdx - 1];
          const right = elements[targetElIdx];
          if (deleted.beam === "begin" && right?.type === "note") {
            right.beam = "begin";
          } else if (deleted.beam === "end" && left?.type === "note") {
            left.beam = "end";
          }
        }
        setElements(new Map(elMap));

        // 削除後のcaret位置を計算
        let idx = caret.idx - 1;
        while (idx > -1) {
          if (idx === 0) {
            setCaret({ ...caret, idx: 0 });
            idx = -1;
          } else if (caretStyle[idx].elIdx !== targetElIdx) {
            setCaret({ ...caret, idx });
            idx = -1;
          } else {
            idx--;
          }
        }
      }}
    >
      <div className="keyImg backspace" />
    </GrayKey>
  );
};

const ArrowLeft = () => {
  const [caret, setCaret] = useAtom(focusAtom);
  return (
    <GrayKey
      onClick={() => {
        // TODO applyBeamForLastEdited
        const idx = Math.max(caret.idx - 1, 0);
        setCaret({ ...caret, idx });
      }}
    >
      <div className="keyImg toLeft" />
    </GrayKey>
  );
};

const ArrowRight = () => {
  const [caret, setCaret] = useAtom(focusAtom);
  const carets = useAtomValue(caretStyleAtom);
  return (
    <GrayKey
      onClick={() => {
        // TODO applyBeamForLastEdited
        const idx = Math.min(caret.idx + 1, carets.length - 1);
        setCaret({ ...caret, idx });
      }}
    >
      <div className="keyImg toRight" />
    </GrayKey>
  );
};

const beamModeAtom = atom<BeamModes>("nobeam");

const BeamToggle = () => {
  const [beamMode, setBeamMode] = useAtom(beamModeAtom);
  // TODO　ダブルクリック→"rock"
  return (
    <GrayKey
      onClick={() => setBeamMode(beamMode === "nobeam" ? "beam" : "nobeam")}
    >
      <div className={`keyImg changeBeam ${beamMode}`} />
    </GrayKey>
  );
};

const Dynamics = () => (
  <WhiteKey>
    <div className="keyImg dynamics" />
  </WhiteKey>
);

const useInputBar: () => (subtype: BarTypes) => void = () => {
  const [caret, setCaret] = useAtom(focusAtom);
  const baseElements = useBaseElements();
  const beamMode = useAtomValue(beamModeAtom);
  const [elMap, setElements] = useAtom(elementsAtom);
  return useCallback(
    (subtype: BarTypes) => {
      const { elements, caretAdvance } = inputMusicalElement({
        caretIndex: caret.idx,
        elements: baseElements,
        newElement: {
          type: "bar",
          subtype,
        },
        beamMode,
      });
      setCaret({ ...caret, idx: caret.idx + caretAdvance });
      setElements(new Map(elMap).set(caret.staffId, elements));
    },
    [caret, setCaret, baseElements, beamMode, elMap, setElements]
  );
};

const Bars = () => {
  const [preview, setPreview] = useState<boolean>(false);
  const inputBar = useInputBar();
  return (
    <WhiteKey
      {...usePointerHandler({
        onLongDown: () => setPreview(true),
        onUp: (ev) => {
          const div = (ev.target as HTMLDivElement).closest(
            "[data-bartype]"
          ) as HTMLDivElement;
          console.log("target div", div);
          // click時はpreview前にonUpを通るのでbartype: undefinedになる
          const subtype = (div?.dataset.bartype as BarTypes) ?? "single";
          console.log(ev);
          console.log(subtype);
          inputBar(subtype);
          setPreview(false);
        },
        onClick: () => inputBar("single"),
      })}
    >
      <div className="keyImg bars">
        {preview && (
          <div className="candidateContainer">
            <div className="candidate top final" data-bartype="final">
              <div className="buttonImage" />
            </div>
            <div className="candidate left double" data-bartype="double">
              <div className="buttonImage" />
            </div>
            <div className="candidate center single" data-bartype="single">
              <div className="buttonImage" />
            </div>
            <div className="candidate right repeat" data-bartype="repeat">
              <div className="buttonImage" />
            </div>
            <div className="candidate bottom single" data-bartype="single">
              <div className="buttonImage" />
            </div>
          </div>
        )}
      </div>
    </WhiteKey>
  );
};

const Return = () => (
  <GrayKey>
    <div className="keyImg returnKey" />
  </GrayKey>
);

const Accidentals = () => {
  const { accidentalMode, changeAccidentalMode } = useAccidentalMode();
  return (
    <GrayKey onClick={changeAccidentalMode}>
      <div className="keyImg accidentals">
        <div className="accidentalsContainer">
          <div
            className={`sharp ${accidentalMode === "sharp" ? "selected" : ""}`}
          ></div>
          <div
            className={`natural ${
              accidentalMode === "natural" ? "selected" : ""
            }`}
          ></div>
          <div
            className={`flat ${accidentalMode === "flat" ? "selected" : ""}`}
          ></div>
        </div>
      </div>
    </GrayKey>
  );
};

const Slur = () => (
  <WhiteKey>
    <div className="keyImg slur" />
  </WhiteKey>
);

const Accent = () => (
  <WhiteKey>
    <div className="keyImg accent" />
  </WhiteKey>
);

const Fermata = () => (
  <WhiteKey>
    <div className="keyImg fermata" />
  </WhiteKey>
);

const Tie = () => (
  <GrayKey>
    <div className="keyImg changeTie notie">
      <div className="buttonImage"></div>
    </div>
  </GrayKey>
);

const KeyRow = ({ children }: { children: React.ReactNode }) => {
  return <div className="keyRow">{children}</div>;
};

const WhiteKey = ({
  isActive,
  children,
  ...rest
}: { isActive?: boolean } & React.ComponentProps<"button">) => {
  return (
    <button className={`key white ${isActive ? "active" : ""}`} {...rest}>
      {children}
    </button>
  );
};

const GrayKey = ({
  onClick,
  children,
}: {
  onClick?: () => void;
  children?: React.ReactNode;
}) => {
  return (
    <div className="key gray" onClick={onClick}>
      {children}
    </div>
  );
};

export const pitchByDistance = (
  scale: number,
  dy: number,
  origin: Pitch
): Pitch => {
  const unitY = (bravura.UNIT / 2) * scale;
  return Math.round(dy / unitY + origin);
};
