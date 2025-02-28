import { useAtom } from "jotai";
import { RootNote, rootNotes } from "./Keyboard";
import { chordRootSelectorAtom } from "@/atom";
import { useAccidentalMode } from "@/hooks/accidental";
import React from "react";

export const ChordRootSelector = () => {
  const [chordRootSelector, setChordRootSelector] = useAtom(
    chordRootSelectorAtom
  );
  const accidentalMode = useAccidentalMode();
  const onClick = (note: RootNote) => {
    setChordRootSelector({
      duration: chordRootSelector?.duration!,
      root: { note, accidental: accidentalMode.accidentalMode },
    });
  };
  return (
    <div className="chordRootSelector">
      {rootNotes.map((root: RootNote) => (
        <div className="chordRoot" key={root} onClick={() => onClick(root)}>
          {root}
        </div>
      ))}
    </div>
  );
};

export const ChordTypeSelector = () => {};
