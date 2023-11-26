import { pitchByDistance } from "@/org/callbacks/note-input";
import { BeamModes, TieModes, kAccidentalModes } from "@/org/input-modes";
import {
  BarTypes,
  Duration,
  MusicalElement,
  PitchAcc,
} from "@/org/notation/types";
import { getPreviewScale } from "@/org/score-preferences";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import Image from "next/image";
import {
  caretAtom,
  caretStyleAtom,
  elementsAtom,
  previewSetterAtom,
} from "./atom";
import { usePointerHandler } from "./hooks";
import { useCallback, useMemo, useState } from "react";
import { sortPitches } from "@/org/pitch";
import { inputMusicalElement } from "@/org/score-updater";

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
      <Footer>
        {/* desktop only */}
        {/* <Handle /> */}
      </Footer>
    </Root>
  );
};

const noteInputModeAtom = atom<"note" | "rest">("note");

const NoteRestToggle = () => {
  const [noteInputMode, setNoteInputMode] = useAtom(noteInputModeAtom);
  return (
    <>
      {noteInputMode === "note" ? (
        <GrayKey onClick={() => setNoteInputMode("rest")}>
          <div className="relative w-2/3 h-2/3">
            <Image
              src="/img/r4.png"
              fill={true}
              alt="rest mode"
              className="object-contain"
            />
          </div>
        </GrayKey>
      ) : (
        <GrayKey onClick={() => setNoteInputMode("note")}>
          <div className="relative w-1/5 h-2/3">
            <Image
              src="/img/n4.png"
              fill={true}
              alt="note mode"
              className="object-contain"
            />
          </div>
        </GrayKey>
      )}
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
  const caret = useAtomValue(caretAtom);
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
  const caret = useAtomValue(caretAtom);
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
  const caret = useAtomValue(caretAtom);
  return useMemo(
    () => [...(elements.get(caret.staffId) ?? [])],
    [elements, caret.staffId]
  );
};

const useInputElements: (duration: Duration) => (newPitch: PitchAcc) => {
  elements: MusicalElement[];
  insertedIndex: number;
  caretAdvance: number;
} = (duration: Duration) => {
  const caret = useAtomValue(caretAtom);
  const baseElements = useBaseElements();
  const inputMode = useAtomValue(noteInputModeAtom);
  const beamMode = useAtomValue(beamModeAtom);
  const accidental = kAccidentalModes[useAtomValue(accidentalModeIdxAtom)];
  const tietie = useTie();
  const sortChord = useSortChord();
  return useCallback(
    (newPitch: PitchAcc) => {
      const _ne = getNewElement({
        mode: inputMode,
        pitch: newPitch,
        duration,
      });
      const ne = tietie(_ne);
      const newElement = sortChord(ne);
      return inputMusicalElement({
        caretIndex: caret.idx,
        elements: baseElements,
        newElement,
        beamMode,
      });
    },
    [caret.idx, baseElements, inputMode, beamMode, duration, accidental]
  );
};

const usePreviewHandlers = (duration: Duration) => {
  const preview = useSetAtom(previewSetterAtom);
  const accidental = kAccidentalModes[useAtomValue(accidentalModeIdxAtom)];
  const genPreviewElements = useInputElements(duration);
  const [caret, setCaret] = useAtom(caretAtom);
  const [elMap, setElements] = useAtom(elementsAtom);

  return usePointerHandler({
    onLongDown: (ev) => {
      const newPitch = {
        pitch: pitchByDistance(getPreviewScale(), 0, 6),
        accidental,
      };
      preview({
        canvasCenter: { x: ev.clientX, y: ev.clientY },
        ...genPreviewElements(newPitch),
      });
    },
    onUp: (ev, down) => {
      preview(undefined);
      const dy = down.clientY - ev.clientY;
      const newPitch = {
        pitch: pitchByDistance(getPreviewScale(), dy, 6),
        accidental,
      };
      const { elements, insertedIndex, caretAdvance } =
        genPreviewElements(newPitch);
      setCaret({ ...caret, idx: caret.idx + caretAdvance });
      setElements(new Map(elMap).set(caret.staffId, elements));
    },
    onDrag: (ev, down) => {
      const dy = down.clientY - ev.clientY;
      const newPitch = {
        pitch: pitchByDistance(getPreviewScale(), dy, 6),
        accidental,
      };
      preview({
        canvasCenter: { x: ev.clientX, y: ev.clientY },
        ...genPreviewElements(newPitch),
      });
    },
  });
};

const Whole = () => {
  const noteInputMode = useAtomValue(noteInputModeAtom);
  const previewHandlers = usePreviewHandlers(1);
  return (
    <WhiteKey {...previewHandlers}>
      {noteInputMode === "note" ? (
        <div className="relative w-1/4 h-1/4 top-[15%]">
          <Image
            src="/img/n1.png"
            fill={true}
            alt="rest mode"
            className="object-contain"
          />
        </div>
      ) : (
        <div className="relative w-2/5 h-2/5">
          <Image
            src="/img/r1.png"
            fill={true}
            alt="rest mode"
            className="object-contain"
          />
        </div>
      )}
    </WhiteKey>
  );
};

const Half = () => {
  const noteInputMode = useAtomValue(noteInputModeAtom);
  const previewHandlers = usePreviewHandlers(2);
  return (
    <WhiteKey {...previewHandlers}>
      {noteInputMode === "note" ? (
        <div className="relative w-1/5 h-2/3">
          <Image
            src="/img/n2.png"
            fill={true}
            alt="rest mode"
            className="object-contain"
          />
        </div>
      ) : (
        <div className="relative w-2/5 h-2/5">
          <Image
            src="/img/r2.png"
            fill={true}
            alt="rest mode"
            className="object-contain"
          />
        </div>
      )}
    </WhiteKey>
  );
};

const Quarter = () => {
  const noteInputMode = useAtomValue(noteInputModeAtom);
  const previewHandlers = usePreviewHandlers(4);
  return (
    <WhiteKey {...previewHandlers}>
      {noteInputMode === "note" ? (
        <div className="relative w-1/5 h-2/3">
          <Image
            src="/img/n4.png"
            fill={true}
            alt="rest mode"
            className="object-contain"
          />
        </div>
      ) : (
        <div className="relative w-2/3 h-2/3">
          <Image
            src="/img/r4.png"
            fill={true}
            alt="rest mode"
            className="object-contain"
          />
        </div>
      )}
    </WhiteKey>
  );
};

const Eighth = () => {
  const noteInputMode = useAtomValue(noteInputModeAtom);
  const beamMode = useAtomValue(beamModeAtom);
  const previewHandlers = usePreviewHandlers(8);
  return (
    <WhiteKey {...previewHandlers}>
      {noteInputMode === "note" ? (
        <div className="relative w-full h-2/3">
          <Image
            src={beamMode === "nobeam" ? "/img/n8.png" : "/img/beam8.svg"}
            fill={true}
            alt="rest mode"
            className="object-contain"
          />
        </div>
      ) : (
        <div className="relative w-1/5 h-full">
          <Image
            src="/img/r8.png"
            fill={true}
            alt="rest mode"
            className="object-contain"
          />
        </div>
      )}
    </WhiteKey>
  );
};

const Sixteenth = () => {
  const noteInputMode = useAtomValue(noteInputModeAtom);
  const beamMode = useAtomValue(beamModeAtom);
  const previewHandlers = usePreviewHandlers(16);
  return (
    <WhiteKey {...previewHandlers}>
      {noteInputMode === "note" ? (
        <div className="relative w-full h-2/3">
          <Image
            src={beamMode === "nobeam" ? "/img/n16.png" : "/img/beam16.svg"}
            fill={true}
            alt="rest mode"
            className="object-contain"
          />
        </div>
      ) : (
        <div className="relative w-1/5 h-full">
          <Image
            src="/img/r16.png"
            fill={true}
            alt="rest mode"
            className="object-contain"
          />
        </div>
      )}
    </WhiteKey>
  );
};

const ThirtySecond = () => {
  const noteInputMode = useAtomValue(noteInputModeAtom);
  const beamMode = useAtomValue(beamModeAtom);
  const previewHandlers = usePreviewHandlers(32);
  return (
    <WhiteKey {...previewHandlers}>
      {noteInputMode === "note" ? (
        <div className="relative w-full h-2/3">
          <Image
            src={beamMode === "nobeam" ? "/img/n32.png" : "/img/beam32.svg"}
            fill={true}
            alt="rest mode"
            className="object-contain"
          />
        </div>
      ) : (
        <div className="relative w-1/5 h-full">
          <Image
            src="/img/r32.png"
            fill={true}
            alt="rest mode"
            className="object-contain"
          />
        </div>
      )}
    </WhiteKey>
  );
};

const Backspace = () => {
  const [caret, setCaret] = useAtom(caretAtom);
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
      <div className="relative w-2/5 h-2/5">
        <Image
          src="/img/backspace_black_24dp.svg"
          fill={true}
          alt="rest mode"
          className="object-contain"
        />
      </div>
    </GrayKey>
  );
};

const ArrowLeft = () => {
  const [caret, setCaret] = useAtom(caretAtom);
  return (
    <GrayKey
      onClick={() => {
        // TODO applyBeamForLastEdited
        const idx = Math.max(caret.idx - 1, 0);
        setCaret({ ...caret, idx });
      }}
    >
      <div className="relative w-2/5 h-2/5">
        <Image
          src="/img/west_black_24dp.svg"
          fill={true}
          alt="rest mode"
          className="object-contain"
        />
      </div>
    </GrayKey>
  );
};

const ArrowRight = () => {
  const [caret, setCaret] = useAtom(caretAtom);
  const carets = useAtomValue(caretStyleAtom);
  return (
    <GrayKey
      onClick={() => {
        // TODO applyBeamForLastEdited
        const idx = Math.min(caret.idx + 1, carets.length - 1);
        setCaret({ ...caret, idx });
      }}
    >
      <div className="relative w-2/5 h-2/5">
        <Image
          src="/img/east_black_24dp.svg"
          fill={true}
          alt="rest mode"
          className="object-contain"
        />
      </div>
    </GrayKey>
  );
};

const beamModeAtom = atom<BeamModes>("nobeam");

const BeamToggle = () => {
  const [beamMode, setBeamMode] = useAtom(beamModeAtom);
  // TODO　ダブルクリック→"rock"
  return (
    <>
      {beamMode === "nobeam" && (
        <GrayKey onClick={() => setBeamMode("beam")}>
          <div className="relative w-1/2 h-1/2">
            <Image
              src="/img/nobeam.png"
              fill={true}
              alt="rest mode"
              className="object-contain"
            />
          </div>
        </GrayKey>
      )}
      {beamMode === "beam" && (
        <GrayKey onClick={() => setBeamMode("nobeam")}>
          <div className="relative w-1/2 h-1/2">
            <Image
              src="/img/beam.png"
              fill={true}
              alt="rest mode"
              className="object-contain"
            />
          </div>
        </GrayKey>
      )}
    </>
  );
};

const Dynamics = () => (
  <WhiteKey>
    <div className="relative w-3/5 h-3/5">
      <Image
        src="/img/dynamics.svg"
        fill={true}
        alt="rest mode"
        className="object-contain"
      />
    </div>
  </WhiteKey>
);

const useInputBar: () => (subtype: BarTypes) => void = () => {
  const [caret, setCaret] = useAtom(caretAtom);
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

// tailwindを変数に切り出すと補完が効かなくてつらい
const candidateStyleBase =
  "relative w-full h-full bg-white hover:bg-[#027bff] box-border border-gray-200";
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
          console.log("target div", div)
          const subtype = div?.dataset.bartype as BarTypes;
          console.log(ev);
          console.log(subtype);
          inputBar(subtype);
          setPreview(false);
        },
        onClick: () => inputBar("single"),
      })}
    >
      {!preview && (
        <div className="relative w-1/2 h-1/2">
          <Image
            src="/img/bars.svg"
            fill={true}
            alt="rest mode"
            className="object-contain"
          />
        </div>
      )}
      {preview && (
        <div className="relative grid grid-cols-3 grid-rows-3 w-[330%] h-[330%] top-[-115%] left-[-115%] drop-shadow-sm">
          <div
            className={`${candidateStyleBase} col-start-2 border-b rounded-t-[4px]`}
            data-bartype="final"
          >
            <Image
              src="/img/barline_final.svg"
              fill={true}
              alt="barline final"
              className="w-full h-full"
            />
          </div>
          <div
            className={`${candidateStyleBase} row-start-2 border-r rounded-l-[4px]`}
            data-bartype="double"
          >
            <Image
              src="/img/barline_double.svg"
              fill={true}
              alt="barline double"
              className="w-full h-full"
            />
          </div>
          <div
            className={`${candidateStyleBase} row-start-2 border`}
            data-bartype="single"
          >
            <Image
              src="/img/barline_single.svg"
              fill={true}
              alt="barline single"
              className="w-full h-full"
            />
          </div>
          <div
            className={`${candidateStyleBase} row-start-2 border-l rounded-r-[4px]`}
            data-bartype="repeat"
          >
            <Image
              src="/img/barline_repeat.svg"
              fill={true}
              alt="barline repeat"
              className="w-full h-full"
            />
          </div>
          <div
            className={`${candidateStyleBase} col-start-2 row-start-3 border-t rounded-b-[4px]`}
            data-bartype="single"
          >
            <Image
              src="/img/barline_single.svg"
              fill={true}
              alt="barline single"
              className="w-full h-full"
            />
          </div>
        </div>
      )}
    </WhiteKey>
  );
};

const Return = () => (
  <GrayKey>
    <div className="relative w-2/5 h-2/5">
      <Image
        src="/img/keyboard_return_black_24dp.svg"
        fill={true}
        alt="rest mode"
        className="object-contain"
      />
    </div>
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
      <div
        className={`${baseClassName} ${
          accidentalMode === "sharp" ? "" : disabledClassName
        }`}
      >
        <Image
          src="/img/sharp.svg"
          fill={true}
          alt="rest mode"
          className="object-contain"
        />
      </div>
      <div
        className={`${baseClassName} ${
          accidentalMode === "natural" ? "" : disabledClassName
        }`}
      >
        <Image
          src="/img/natural.svg"
          fill={true}
          alt="rest mode"
          className="object-contain"
        />
      </div>
      <div
        className={`${baseClassName} ${
          accidentalMode === "flat" ? "" : disabledClassName
        }
      }`}
      >
        <Image
          src="/img/flat.svg"
          fill={true}
          alt="rest mode"
          className="object-contain"
        />
      </div>
    </GrayKey>
  );
};

const Slur = () => (
  <WhiteKey>
    <div className="relative w-1/2 h-1/2">
      <Image
        src="/img/slur.svg"
        fill={true}
        alt="rest mode"
        className="object-contain"
      />
    </div>
  </WhiteKey>
);

const Accent = () => (
  <WhiteKey>
    <div className="relative w-2/5 h-2/5">
      <Image
        src="/img/accent.svg"
        fill={true}
        alt="rest mode"
        className="object-contain"
      />
    </div>
  </WhiteKey>
);

const Fermata = () => (
  <WhiteKey>
    <div className="relative w-1/4 h-1/4">
      <Image
        src="/img/fermata.svg"
        fill={true}
        alt="rest mode"
        className="object-contain"
      />
    </div>
  </WhiteKey>
);

const Tie = () => (
  <GrayKey>
    <div className="relative w-1/2 h-1/2">
      <Image
        src="/img/tie.svg"
        fill={true}
        alt="rest mode"
        className="object-contain"
      />
    </div>
  </GrayKey>
);

const Root = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col items-center absolute bg-keyboard w-full left-0 bottom-0 keyboardSafeArea">
      {children}
    </div>
  );
};

const Header = () => {
  return <div className="h-[48px]"></div>;
};

const Container = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col gap-y-[6px] w-[98%] aspect-[1.85]">
      {children}
    </div>
  );
};

const KeyRow = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="grid grid-cols-5 grid-rows-1 gap-x-[6px] w-full h-full">
      {children}
    </div>
  );
};

const WhiteKey = ({ children, ...rest }: React.ComponentProps<"div">) => {
  return (
    <div
      className="bg-white active:bg-[#b4b8c1] rounded-[4px] shadow-[0_1px_#8d9095]"
      {...rest}
    >
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
    <div
      className="bg-[#acaebb] active:bg-white rounded-[4px] shadow-[0_1px_#8d9095]"
      onClick={onClick}
    >
      {children}
    </div>
  );
};

const Footer = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex w-full h-[15px] bottom-0">{children}</div>;
};

// タブレット用
const Handle = () => {
  return (
    <div className="mt-[18px] mr-auto mb-0 ml-auto bg-[#aaa] w-[40px] h-[5px] rounded-[2px]"></div>
  );
};
