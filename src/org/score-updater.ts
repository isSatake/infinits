import { MusicalElement } from "./notation/types";
import { sortPitches } from "./pitch";
import { BeamModes } from "./input-modes";

// 直接score-stateを更新していいと思ったが、previewでも使ってるのでむずい
// reducerみたいな人になるべきかな
export function inputMusicalElement({
  caretIndex,
  elements,
  newElement,
  beamMode,
}: {
  caretIndex: number;
  elements: MusicalElement[];
  newElement: MusicalElement;
  beamMode: BeamModes;
}) {
  const _elements = [...elements];
  let insertedIndex = 0;
  let caretAdvance = 0;
  if (caretIndex === 0) {
    const right = _elements[caretIndex]; // まだ挿入してないのでcaretIdxと同じ
    applyBeam(beamMode, newElement, undefined, right);
    _elements.splice(caretIndex, 0, newElement);
    caretAdvance = 2;
  } else {
    if (caretIndex % 2 === 0) {
      // 挿入
      const insertIdx = caretIndex / 2;
      const left = _elements[insertIdx - 1];
      const right = _elements[insertIdx]; // まだ挿入してないのでinsertIdxと同じ
      console.log("insertIdx", insertIdx, "left", left, "right", right);
      applyBeam(beamMode, newElement, left, right);
      _elements.splice(insertIdx, 0, newElement);
      caretAdvance = 2;
      insertedIndex = insertIdx;
    } else {
      // 上書き
      const overrideIdx = caretIndex === 1 ? 0 : (caretIndex - 1) / 2;
      const overrideEl = _elements[overrideIdx];
      if (
        newElement.type === "note" &&
        overrideEl.type === "note" &&
        newElement.duration === overrideEl.duration
      ) {
        newElement.pitches = sortPitches([
          ...overrideEl.pitches,
          ...newElement.pitches,
        ]);
      }
      const left = _elements[overrideIdx - 1];
      const right = _elements[overrideIdx + 1];
      applyBeam(beamMode, newElement, left, right);
      _elements.splice(overrideIdx, 1, newElement);
      insertedIndex = overrideIdx;
    }
  }
  return { elements: _elements, insertedIndex, caretAdvance };
}

/**
 * algorithm: https://gyazo.com/09cdc43aa31b8dc2cb487556dac039c2
 * @param beamMode
 * @param insert
 * @param left
 * @param right
 */
function applyBeam(
  beamMode: BeamModes,
  insert: MusicalElement,
  left?: MusicalElement,
  right?: MusicalElement
): void {
  if (insert.type === "note" && beamMode !== "nobeam") {
    // beamを挿入
    if (
      left?.type === "note" &&
      right?.type === "note" &&
      left.beam &&
      right.beam
    ) {
      // beamに囲まれる
      if (left.beam === "begin") {
        if (right.beam === "begin") {
          insert.beam = "continue";
          right.beam = "continue";
        } else {
          insert.beam = "continue";
        }
      } else if (left.beam === "continue") {
        if (right.beam === "begin") {
          insert.beam = "end";
        } else {
          insert.beam = "continue";
        }
      }
    } else {
      insert.beam = "begin";
      if (
        left?.type === "note" &&
        (left?.beam === "begin" || left?.beam === "continue")
      ) {
        insert.beam = "continue";
      }
      if (right?.type === "note" && right?.beam === "begin") {
        right.beam = "continue";
      }
    }
  } else {
    // no beam or restを挿入
    if (right?.type === "note") {
      if (right?.beam === "continue") {
        right.beam = "begin";
      } else if (right?.beam === "end") {
        delete right.beam;
      }
    }
    if (left?.type === "note") {
      if (left?.beam === "begin") {
        delete left.beam;
      } else if (left?.beam === "continue") {
        left.beam = "end";
      }
    }
  }
}
