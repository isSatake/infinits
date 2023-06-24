import { Bar } from "../notation/types";
import { updateMain } from "../score-renderer";
import {
  getElements,
  getBeamMode,
  setLastEditedIndex,
  setElements,
  getEditingStaffId,
  getCurrentCaretIdx,
  setCurrentCaretIdx,
} from "../score-states";
import { inputMusicalElement } from "../score-updater";

export interface IBarInputCallback {
  commit(bar: Bar): void;
}

export class BarInputCallback implements IBarInputCallback {
  constructor() {}

  commit(bar: Bar) {
    const id = getEditingStaffId();
    if (id === undefined) {
      return;
    }
    const { elements, insertedIndex, caretAdvance } = inputMusicalElement({
      caretIndex: getCurrentCaretIdx(id),
      elements: getElements(id),
      newElement: bar,
      beamMode: getBeamMode(),
    });
    setLastEditedIndex(id, insertedIndex);
    setCurrentCaretIdx(id, getCurrentCaretIdx(id) + caretAdvance);
    setElements(id, elements);
    updateMain();
  }
}
