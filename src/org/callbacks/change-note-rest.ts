import { getIsNoteInputMode, flipIsNoteInputMode } from "../score-states";

export interface IChangeNoteRestCallback {
  isNoteInputMode(): boolean;
  change(): void;
}

export class ChangeNoteRestCallback implements IChangeNoteRestCallback {
  private noteKeyEls = Array.from(document.getElementsByClassName("note"));
  private changeNoteRestKey =
    document.getElementsByClassName("changeNoteRest")[0];

  constructor() {}

  isNoteInputMode() {
    return getIsNoteInputMode();
  }

  change() {
    this.noteKeyEls.forEach((el) => {
      el.className = el.className.replace(
        this.isNoteInputMode() ? "note" : "rest",
        this.isNoteInputMode() ? "rest" : "note"
      );
    });
    this.changeNoteRestKey.className = this.changeNoteRestKey.className.replace(
      this.isNoteInputMode() ? "rest" : "note",
      this.isNoteInputMode() ? "note" : "rest"
    );
    flipIsNoteInputMode();
  }
}
