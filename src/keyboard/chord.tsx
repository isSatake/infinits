import { useAtom } from "jotai";
import { useElementsComposer } from "./Keyboard";
import { chordSelectionAtom, elementsAtom, focusAtom, useStaffs } from "@/atom";
import { useAccidentalMode } from "@/hooks/accidental";
import React, { FC } from "react";
import {
  chordTypes,
  Duration,
  ChordType,
  ChordRoot,
  RootNote,
  rootNotes,
  keySignatures,
} from "@/org/notation/types";
import { usePointerHandler } from "@/hooks/hooks";
import { convertPitchToRoot } from "@/core/pitch";
import { chordToPitchAcc } from "@/core/chord";
import * as tone from "@/tone";

export const ChordSelector = () => {
  const [chordSelection, setChordSelection] = useAtom(chordSelectionAtom);
  const accidentalMode = useAccidentalMode();
  const onSelectRoot = (note: RootNote) => {
    setChordSelection({
      duration: chordSelection?.duration!,
      root: {
        pitch: rootNotes.indexOf(note),
        accidental: accidentalMode.accidentalMode,
      },
    });
  };
  if (chordSelection?.root) {
    return (
      <TypeSelector
        duration={chordSelection.duration}
        root={chordSelection.root}
        onBack={() => setChordSelection({ duration: chordSelection.duration })}
      />
    );
  } else {
    return <RootSelector onSelect={onSelectRoot} />;
  }
};

const RootSelector: FC<{ onSelect: (note: RootNote) => void }> = ({
  onSelect,
}) => {
  return (
    <div className="chordRootSelector">
      {rootNotes.map((root: RootNote) => (
        <div className="chordRoot" key={root} onClick={() => onSelect(root)}>
          {root}
        </div>
      ))}
    </div>
  );
};

const TypeSelector: FC<{
  duration: Duration;
  root: ChordRoot;
  onBack: () => void;
}> = ({ onBack, ...rest }) => {
  return (
    <>
      <div className="backToRoot" onClick={onBack}>
        {"<"}
      </div>
      <div className="typeDivider" />
      <div className="chordTypeSelector">
        {chordTypes.map((type: ChordType) => (
          <Type type={type} key={type} {...rest} />
        ))}
      </div>
    </>
  );
};

const Type: FC<{ type: ChordType; duration: Duration; root: ChordRoot }> = ({
  type,
  duration,
  root,
}) => {
  const rootName = convertPitchToRoot(root.pitch);
  const [caret, setCaret] = useAtom(focusAtom);
  const [elMap, setElements] = useAtom(elementsAtom);
  const composeElements = useElementsComposer(duration);
  const staff = useStaffs().get(caret.staffId);
  const handlers = usePointerHandler({
    onUp: () => {
      if (!staff) return;
      console.log(`${rootName}${root.accidental ?? ""}${type}`);
      // composeElements
      const pitches = chordToPitchAcc({ root, type }, keySignatures.C);
      const { elements, insertedIndex, caretAdvance } =
        composeElements(pitches);
      setCaret({
        ...caret,
        idx: caret.idx + caretAdvance,
      });
      setElements(new Map(elMap).set(caret.staffId, elements));
      tone.play([elements[insertedIndex]], 8);
    },
  });
  return (
    <div className="chordType" key={type} {...handlers}>
      {`${rootName}${root.accidental ?? ""}${type}`}
    </div>
  );
};
