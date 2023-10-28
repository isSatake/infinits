import { pitchByDistance } from "@/org/callbacks/note-input";
import {
  AccidentalModes,
  BeamModes,
  TieModes,
  kAccidentalModes,
} from "@/org/input-modes";
import { Duration, MusicalElement, PitchAcc } from "@/org/notation/types";
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
import { useMemo } from "react";
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

const usePreview = (duration: Duration) => {
  // main elements
  const elements = useAtomValue(elementsAtom);
  // tie mode
  const tieMode = useAtomValue(tieAtom);
  // caret index
  const caret = useAtomValue(caretAtom);
  console.log("caret", caret);
  const inputMode = useAtomValue(noteInputModeAtom);
  const beamMode = useAtomValue(beamModeAtom);
  const preview = useSetAtom(previewSetterAtom);
  const accidental = kAccidentalModes[useAtomValue(accidentalModeIdxAtom)];

  const baseElements = useMemo(
    () => [...(elements.get(caret.staffId) ?? [])],
    [elements, caret.staffId]
  );

  return usePointerHandler({
    onLongDown: (ev) => {
      const newPitch = {
        pitch: pitchByDistance(getPreviewScale(), 0, 6),
        accidental,
      };
      const newElement = getNewElement({
        mode: inputMode,
        pitch: newPitch,
        duration,
      });
      // タイの整合を取る
      if (
        newElement.type === "note" &&
        !!tieMode &&
        caret.idx > 0 &&
        caret.idx % 2 === 0
      ) {
        const prevEl = baseElements[caret.idx / 2 - 1];
        if (
          prevEl.type === "note" &&
          prevEl.pitches[0].pitch === newPitch.pitch &&
          prevEl.pitches[0].accidental === newPitch.accidental
        ) {
          prevEl.tie = "start";
          newElement.tie = "stop";
        }
      }
      // 和音をソート
      if (caret.idx > 0 && caret.idx % 2 !== 0) {
        const idx = caret.idx === 1 ? 0 : (caret.idx - 1) / 2;
        const currentEl = baseElements[idx];
        if (
          newElement.type === "note" &&
          currentEl.type === "note" &&
          newElement.duration === currentEl.duration
        ) {
          newElement.pitches = sortPitches([
            ...currentEl.pitches,
            ...newElement.pitches,
          ]);
        }
      }
      const { elements, insertedIndex } = inputMusicalElement({
        caretIndex: caret.idx,
        elements: baseElements,
        newElement,
        beamMode,
      });
      //🔥
      preview({
        canvasCenter: { x: ev.clientX, y: ev.clientY },
        elements,
      });
    },
    onUp: () => preview(undefined),
    onDrag: (ev, down) => {
      const dy = down.clientY - ev.clientY;
      const newPitch = {
        pitch: pitchByDistance(getPreviewScale(), dy, 6),
        accidental,
      };
      const newElement = getNewElement({
        mode: inputMode,
        pitch: newPitch,
        duration,
      });
      preview({
        canvasCenter: { x: ev.clientX, y: ev.clientY },
        elements: [newElement],
      });
    },
  });
};

const Whole = () => {
  const noteInputMode = useAtomValue(noteInputModeAtom);
  const previewHandlers = usePreview(1);
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
  const previewHandlers = usePreview(2);
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
  const previewHandlers = usePreview(4);
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
  const previewHandlers = usePreview(8);
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
  const previewHandlers = usePreview(16);
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
  const previewHandlers = usePreview(32);
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

const Backspace = () => (
  <GrayKey>
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

const Bars = () => (
  <WhiteKey>
    <div className="relative w-1/2 h-1/2">
      <Image
        src="/img/bars.svg"
        fill={true}
        alt="rest mode"
        className="object-contain"
      />
    </div>
  </WhiteKey>
);

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
      className="flex items-center justify-center bg-white active:bg-[#b4b8c1] rounded-[4px] shadow-[0_1px_#8d9095]"
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
      className="flex items-center justify-center bg-[#acaebb] active:bg-white rounded-[4px] shadow-[0_1px_#8d9095]"
      onClick={onClick}
    >
      {children}
    </div>
  );
};

const Footer = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex w-full h-[15px] bottom-0">{children}</div>;
};

const Handle = () => {
  return (
    <div className="mt-[18px] mr-auto mb-0 ml-auto bg-[#aaa] w-[40px] h-[5px] rounded-[2px]"></div>
  );
};
