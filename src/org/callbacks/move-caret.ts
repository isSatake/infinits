import { applyBeamForLastEdited } from "../notation/notation";
import { updateMain } from "../score-renderer";
import {
  getLastEditedIndex,
  getElements,
  getEditingStaffId,
  getCurrentCaretIdx,
  setCurrentCaretIdx,
  getCarets,
} from "../score-states";

export interface IMoveCaretCallback {
  back(): void;
  forward(): void;
}

export class MoveCaretCallback implements IMoveCaretCallback {
  constructor() {}

  back() {
    const id = getEditingStaffId();
    if (!id) return;
    if (getCurrentCaretIdx(id) % 2 !== 0) {
      const idx =
        getCurrentCaretIdx(id) === 1 ? 0 : (getCurrentCaretIdx(id) - 1) / 2;
      if (idx === getLastEditedIndex(id)) {
        const lastEl = getElements(id)[getLastEditedIndex(id)];
        const left = getElements(id)[idx - 1];
        const right = getElements(id)[idx + 1];
        applyBeamForLastEdited(lastEl, left, right);
      }
    }
    setCurrentCaretIdx(id, Math.max(getCurrentCaretIdx(id) - 1, 0));
    updateMain();
  }

  forward() {
    const id = getEditingStaffId();
    if (!id) return;
    if (getCurrentCaretIdx(id) % 2 === 0) {
      const idx = getCurrentCaretIdx(id) / 2 - 1;
      if (idx === getLastEditedIndex(id)) {
        const lastEl = getElements(id)[getLastEditedIndex(id)];
        const left = getElements(id)[idx - 1];
        const right = getElements(id)[idx + 1];
        applyBeamForLastEdited(lastEl, left, right);
      }
    }
    setCurrentCaretIdx(
      id,
      Math.min(getCurrentCaretIdx(id) + 1, getCarets(id).length)
    );
    updateMain();
  }
}
