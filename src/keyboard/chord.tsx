import { useAtom } from "jotai";
import { RootNote, rootNotes } from "./Keyboard";
import { ChordSelection, chordSelectionAtom } from "@/atom";
import { useAccidentalMode } from "@/hooks/accidental";
import React, { FC } from "react";
import { ChordType, chordTypes } from "@/org/notation/types";

export const ChordSelector = () => {
  const [chordSelection, setChordSelection] = useAtom(chordSelectionAtom);
  const accidentalMode = useAccidentalMode();
  const onSelectRoot = (note: RootNote) => {
    setChordSelection({
      duration: chordSelection?.duration!,
      root: { note, accidental: accidentalMode.accidentalMode },
    });
  };
  const onSelectType = (root: ChordSelection["root"]) => (type: ChordType) => {
    console.log(
      "chord selection",
      `${root?.accidental ?? ""}${root?.note}${type}`
    );
  };
  if (chordSelection?.root) {
    return (
      <TypeSelector
        root={chordSelection.root}
        onSelect={onSelectType(chordSelection.root)}
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
  root: ChordSelection["root"];
  onSelect: (type: ChordType) => void;
}> = ({ root, onSelect }) => {
  return (
    <div className="chordTypeSelector">
      {chordTypes.map((type: ChordType) => (
        <div className="chordType" key={type} onClick={() => onSelect(type)}>
          {`${root?.accidental ?? ""}${root?.note}${type}`}
        </div>
      ))}
    </div>
  );
};
