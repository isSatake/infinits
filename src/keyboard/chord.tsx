import { useAtom } from "jotai";
import {  useElementsComposer } from "./Keyboard";
import {
  chordSelectionAtom,
  elementsAtom,
  focusAtom,
  useStaffs,
} from "@/atom";
import { useAccidentalMode } from "@/hooks/accidental";
import React, { FC } from "react";
import { chordTypes, Duration, ChordType, ChordRoot, RootNote, rootNotes } from "@/org/notation/types";
import { usePointerHandler } from "@/hooks/hooks";

export const ChordSelector = () => {
  const [chordSelection, setChordSelection] = useAtom(chordSelectionAtom);
  const accidentalMode = useAccidentalMode();
  const onSelectRoot = (note: RootNote) => {
    setChordSelection({
      duration: chordSelection?.duration!,
      root: { note, accidental: accidentalMode.accidentalMode },
    });
  };
  if (chordSelection?.root) {
    return (
      <TypeSelector
        duration={chordSelection.duration}
        root={chordSelection.root}
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

const TypeSelector: FC<{ duration: Duration; root: ChordRoot }> = (props) => {
  return (
    <div className="chordTypeSelector">
      {chordTypes.map((type: ChordType) => (
        <Type type={type} key={type} {...props} />
      ))}
    </div>
  );
};

const Type: FC<{ type: ChordType; duration: Duration; root: ChordRoot }> = ({
  type,
  duration,
  root,
}) => {
  const [caret, setCaret] = useAtom(focusAtom);
  const [elMap, setElements] = useAtom(elementsAtom);
  const composeElements = useElementsComposer(duration);
  const staff = useStaffs().get(caret.staffId);
  const handlers = usePointerHandler({
    onUp: (ev, down) => {
      if (!staff) return;
      console.log(`${root.note}${root?.accidental ?? ""}${type}`);
      // composeElements
    },
  });
  return (
    <div className="chordType" key={type} {...handlers}>
      {`${root?.accidental ?? ""}${root?.note}${type}`}
    </div>
  );
};
