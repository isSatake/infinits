import { applyBeamForLastEdited } from "../notation/notation";
import { updateMain } from "../score-renderer";
import {
  getBeamMode,
  setBeamMode,
  getElements,
  getLastEditedIndex,
} from "../score-states";
import { BeamModes } from "../input-modes";

export interface IChangeBeamCallback {
  getMode(): BeamModes;
  change(mode: BeamModes): void;
}

export class ChangeBeamCallback implements IChangeBeamCallback {
  private noteKeyEls = Array.from(document.getElementsByClassName("note"));
  constructor() {}
  getMode() {
    return getBeamMode();
  }

  change(mode: BeamModes) {
    this.noteKeyEls.forEach((el) => {
      el.className = el.className.replace(
        mode === "nobeam" ? "beamed" : "nobeam",
        mode === "nobeam" ? "nobeam" : "beamed"
      );
    });
    setBeamMode(mode);
    const lastEl = getElements()[getLastEditedIndex()];
    if (lastEl) {
      const left = getElements()[getLastEditedIndex() - 1];
      const right = getElements()[getLastEditedIndex() + 1];
      applyBeamForLastEdited(lastEl, left, right);
      updateMain();
    }
  }
}
