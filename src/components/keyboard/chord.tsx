import { useAtom } from "jotai";
import { useAccidentalMode } from "@/hooks/accidental";
import React, { FC } from "react";
import {
  chordTypes,
  Duration,
  ChordType,
  ChordRoot,
  RootNote,
  rootNotes,
} from "@/core/types";
import { usePointerHandler } from "@/hooks/hooks";
import { convertPitchToRoot } from "@/core/pitch";
import { chordToPitchAcc } from "@/core/chord";
import * as tone from "@/player/tone";
import { useElementsComposer } from "@/hooks/input";
import { useObjIdMapAtom } from "@/hooks/map-atom";
import { objectAtom, uiAtom } from "@/state/atom";

export const ChordSelector = () => {
  const [chordSelection, setChordSelection] = useAtom(uiAtom.chordSelection);
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
  const [caret, setCaret] = useAtom(uiAtom.focus);
  const [elMap, setElements] = useAtom(objectAtom.elements);
  const composeElements = useElementsComposer(duration);
  const staff = useObjIdMapAtom(objectAtom.rootObjMap).get(caret.rootObjId);
  const handlers = usePointerHandler({
    onUp: () => {
      if (staff?.type !== "staff") return;
      console.log(`${rootName}${root.accidental ?? ""}${type}`);
      // composeElements
      const pitches = chordToPitchAcc({ root, type }, staff.staff.keySignature);
      const { elements, insertedIndex, caretAdvance } =
        composeElements(pitches);
      setCaret({
        ...caret,
        idx: caret.idx + caretAdvance,
      });
      setElements(new Map(elMap).set(caret.rootObjId, elements));
      tone.play(staff.staff.keySignature, [elements[insertedIndex]], 8);
    },
  });
  return (
    <div className="chordType" key={type} {...handlers}>
      {`${rootName}${root.accidental ?? ""}${type}`}
    </div>
  );
};
