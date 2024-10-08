import React, { useRef } from "react";
import { pitchByDistance } from "@/org/callbacks/note-input";
import { BeamModes, TieModes, kAccidentalModes } from "@/org/input-modes";
import {
  BarTypes,
  Duration,
  MusicalElement,
  Note,
  PitchAcc,
  Rest,
} from "@/org/notation/types";
import { getPreviewScale, getPreviewWidth } from "@/org/score-preferences";
import { atom, useAtom, useAtomValue } from "jotai";
import {
  focusAtom,
  caretStyleAtom,
  elementsAtom,
  previewAtom,
  PreviewState,
  useStaffs,
} from "./atom";
import { usePointerHandler } from "./hooks";
import { FC, useCallback, useMemo, useState } from "react";
import { sortPitches } from "@/org/pitch";
import { inputMusicalElement } from "@/org/score-updater";
import { start, Sampler, Part, Transport } from "tone";
import { Time, Frequency } from "tone/build/esm/core/type/Units";

export const Keyboard = () => {
  return (
    <Root>
      <Header />
      <Container>
        <KeyRow>
          <NoteRestToggle />
          <Whole />
          <Half />
          <Quarter />
          <Backspace />
        </KeyRow>
        <KeyRow>
          <ArrowLeft />
          <Eighth />
          <Sixteenth />
          <ThirtySecond />
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
      </Container>
      {/* <Footer> */}
      {/* desktop only */}
      {/* <Handle /> */}
      {/* </Footer> */}
    </Root>
  );
};

const noteInputModeAtom = atom<"note" | "rest">("note");

const NoteRestToggle = () => {
  const [noteInputMode, setNoteInputMode] = useAtom(noteInputModeAtom);
  return (
    <>
      <GrayKey
        onClick={() =>
          setNoteInputMode(noteInputMode === "note" ? "rest" : "note")
        }
      >
        <div
          className={`keyImg changeNoteRest ${
            noteInputMode === "note" ? "note" : "rest"
          }`}
        />
      </GrayKey>
    </>
  );
};

const getNewElement = (p: {
  mode: "note" | "rest";
  duration: Duration;
  pitch: PitchAcc;
}): MusicalElement => {
  const { mode, pitch, duration } = p;
  return mode === "note"
    ? {
        type: "note",
        pitches: [pitch],
        duration,
      }
    : {
        type: "rest",
        duration,
      };
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

const useInputElements: (duration: Duration) => (
  newPitch: PitchAcc,
  position?: "left" | "right"
) => Pick<PreviewState, "elements" | "insertedIndex" | "offsetted"> & {
  caretAdvance: number;
} = (duration: Duration) => {
  const caret = useAtomValue(focusAtom);
  const caretStyle = useAtomValue(caretStyleAtom);
  const baseElements = useBaseElements();
  const inputMode = useAtomValue(noteInputModeAtom);
  const beamMode = useAtomValue(beamModeAtom);
  const accidental = kAccidentalModes[useAtomValue(accidentalModeIdxAtom)];
  const tietie = useTie();
  const sortChord = useSortChord();
  return useCallback(
    (newPitch: PitchAcc, position?: "left" | "right") => {
      const _ne = getNewElement({
        mode: inputMode,
        pitch: newPitch,
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
    [caret.idx, baseElements, inputMode, beamMode, duration, accidental]
  );
};

const usePreviewHandlers = (duration: Duration) => {
  const [preview, setPreview] = useAtom(previewAtom);
  const accidental = kAccidentalModes[useAtomValue(accidentalModeIdxAtom)];
  const genPreviewElements = useInputElements(duration);
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
        ...genPreviewElements(newPitch),
      });
    },
    onUp: (ev, down) => {
      setPreview(undefined);
      const dy = down.clientY - ev.clientY;
      const newPitch = {
        pitch: pitchByDistance(getPreviewScale(), dy, 6),
        accidental,
      };
      const { elements, insertedIndex, caretAdvance } = genPreviewElements(
        newPitch,
        positionRef.current
      );
      setCaret({ ...caret, idx: caret.idx + caretAdvance });
      setElements(new Map(elMap).set(caret.staffId, elements));
      // 入力時のプレビューは8分音符固定
      play([elements[insertedIndex]], 8);
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
        ...genPreviewElements(newPitch, positionRef.current),
      });
    },
  });
};

const play = async (elements: MusicalElement[], duration?: Duration) => {
  const arr: ({ time: Time } & MusicalElement)[] = [];
  let currentPPQ = 0;
  elements
    .filter((el): el is Note | Rest => el.type !== "bar")
    .forEach((el) => {
      arr.push({
        time: `${currentPPQ}i`,
        ...el,
        ...(duration ? { duration } : {}),
      });
      currentPPQ += (Transport.PPQ * 4) / el.duration;
    });
  const part = new Part<{ time: Time } & MusicalElement>((time, value) => {
    if (value.type === "note") {
      sampler.triggerAttackRelease(
        value.pitches.map(convert),
        `${value.duration}n`,
        time
      );
    }
  }, arr);
  await start();
  part.start();
  Transport.start();
};

const Whole: FC = () => {
  const noteInputMode = useAtomValue(noteInputModeAtom);
  const previewHandlers = usePreviewHandlers(1);
  return (
    <WhiteKey {...previewHandlers}>
      <div className={`keyImg whole ${noteInputMode}`} />
    </WhiteKey>
  );
};

const Half = () => {
  const noteInputMode = useAtomValue(noteInputModeAtom);
  const previewHandlers = usePreviewHandlers(2);
  return (
    <WhiteKey {...previewHandlers}>
      <div className={`keyImg half ${noteInputMode}`} />
    </WhiteKey>
  );
};

const Quarter = () => {
  const noteInputMode = useAtomValue(noteInputModeAtom);
  const previewHandlers = usePreviewHandlers(4);
  return (
    <WhiteKey {...previewHandlers}>
      <div className={`keyImg quater ${noteInputMode}`} />
    </WhiteKey>
  );
};

const Eighth = () => {
  const noteInputMode = useAtomValue(noteInputModeAtom);
  const beamMode = useAtomValue(beamModeAtom);
  const previewHandlers = usePreviewHandlers(8);
  return (
    <WhiteKey {...previewHandlers}>
      <div className={`keyImg eighth ${noteInputMode} ${beamMode}`} />
    </WhiteKey>
  );
};

const Sixteenth = () => {
  const noteInputMode = useAtomValue(noteInputModeAtom);
  const beamMode = useAtomValue(beamModeAtom);
  const previewHandlers = usePreviewHandlers(16);
  return (
    <WhiteKey {...previewHandlers}>
      <div className={`keyImg sixteenth ${noteInputMode} ${beamMode}`} />
    </WhiteKey>
  );
};

const ThirtySecond = () => {
  const noteInputMode = useAtomValue(noteInputModeAtom);
  const beamMode = useAtomValue(beamModeAtom);
  const previewHandlers = usePreviewHandlers(32);
  return (
    <WhiteKey {...previewHandlers}>
      <div className={`keyImg thirtySecond ${noteInputMode} ${beamMode}`} />
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

const accidentalModeIdxAtom = atom<number>(0);
const baseClassName = "relative w-1/5 h-2/5";
const disabledClassName = "opacity-30";
const useAccidentalMode = () => {
  const [idx, setIdx] = useAtom(accidentalModeIdxAtom);
  return {
    accidentalMode: kAccidentalModes[idx],
    changeAccidentalMode: () => {
      const nextIdx = (idx + 1) % 4;
      setIdx(nextIdx);
    },
  };
};

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

const Root = ({ children }: { children: React.ReactNode }) => {
  return <div className="keyboard">{children}</div>;
};

const Header = () => {
  const elements = useAtomValue(elementsAtom);
  const { staffId } = useAtomValue(focusAtom);
  const onClick = useCallback(
    () => play(elements.get(staffId) ?? []),
    [elements, staffId]
  );
  return (
    <div className="keyHeader">
      <button className="play" onClick={onClick}></button>
    </div>
  );
};

const Container = ({ children }: { children: React.ReactNode }) => {
  return <div className="keyContainer">{children}</div>;
};

const KeyRow = ({ children }: { children: React.ReactNode }) => {
  return <div className="keyRow">{children}</div>;
};

const WhiteKey = ({ children, ...rest }: React.ComponentProps<"div">) => {
  return (
    <div className="key white" {...rest}>
      {children}
    </div>
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

// const Footer = ({ children }: { children: React.ReactNode }) => {
//   return <div className="flex w-full h-[15px] bottom-0">{children}</div>;
// };

// タブレット用
// const Handle = () => {
//   return (
//     <div className="mt-[18px] mr-auto mb-0 ml-auto bg-[#aaa] w-[40px] h-[5px] rounded-[2px]"></div>
//   );
// };

const sampler = new Sampler({
  urls: {
    A0: "A0.mp3",
    C1: "C1.mp3",
    "D#1": "Ds1.mp3",
    "F#1": "Fs1.mp3",
    A1: "A1.mp3",
    C2: "C2.mp3",
    "D#2": "Ds2.mp3",
    "F#2": "Fs2.mp3",
    A2: "A2.mp3",
    C3: "C3.mp3",
    "D#3": "Ds3.mp3",
    "F#3": "Fs3.mp3",
    A3: "A3.mp3",
    C4: "C4.mp3",
    "D#4": "Ds4.mp3",
    "F#4": "Fs4.mp3",
    A4: "A4.mp3",
    C5: "C5.mp3",
    "D#5": "Ds5.mp3",
    "F#5": "Fs5.mp3",
    A5: "A5.mp3",
    C6: "C6.mp3",
    "D#6": "Ds6.mp3",
    "F#6": "Fs6.mp3",
    A6: "A6.mp3",
    C7: "C7.mp3",
    "D#7": "Ds7.mp3",
    "F#7": "Fs7.mp3",
    A7: "A7.mp3",
    C8: "C8.mp3",
  },
  release: 1,
  baseUrl: "https://tonejs.github.io/audio/salamander/",
}).toDestination();

const keys = ["C", "D", "E", "F", "G", "A", "B"];
const accs = { sharp: "#", natural: "", flat: "b" };
const convert = (pa: PitchAcc): Frequency => {
  const { pitch, accidental } = pa;
  const oct = Math.floor(pitch / 7) + 4;
  const mod = pitch % keys.length;
  const note = mod < 0 ? keys.at(keys.length + mod) : keys.at(mod);
  if (!note) {
    throw new Error("invalid pitch");
  }
  const acc = accs[accidental ?? "natural"];
  return `${note}${acc}${oct}`;
};
