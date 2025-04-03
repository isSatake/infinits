import { inputMusicalElement } from "@/core/score-updater";
import { BarTypes } from "@/core/types";
import { useAccidentalMode } from "@/hooks/accidental";
import { useBaseElements, usePreviewHandlers } from "@/hooks/input";
import { useAtom, useAtomValue } from "jotai";
import React, { FC, useCallback, useState } from "react";
import { usePointerHandler } from "../../hooks/hooks";
import {
  beamModeAtom,
  caretStyleAtom,
  chordSelectionAtom,
  elementsAtom,
  focusAtom,
  NoteInputMode,
  noteInputModeAtom,
  tieModeAtom,
} from "../../state/atom";
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
        const elements = elMap.get(caret.rootObjId);
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
        newElement: { type: "bar", subtype },
        beamMode,
      });
      setCaret({ ...caret, idx: caret.idx + caretAdvance });
      setElements(new Map(elMap).set(caret.rootObjId, elements));
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

const Tie = () => {
  const [tieMode, setTieMode] = useAtom(tieModeAtom);
  return (
    <GrayKey onClick={() => setTieMode(tieMode === "tie" ? "notie" : "tie")}>
      <div className={`keyImg changeTie ${tieMode}`}>
        <div className="buttonImage" />
      </div>
    </GrayKey>
  );
};

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
