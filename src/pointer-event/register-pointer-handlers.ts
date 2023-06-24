import { BarInputCallback } from "../callbacks/bar-input";
import { CanvasCallback } from "../callbacks/canvas";
import { ChangeAccidentalCallback } from "../callbacks/change-accidental";
import { ChangeBeamCallback } from "../callbacks/change-beam";
import { ChangeNoteRestCallback } from "../callbacks/change-note-rest";
import { ChangeTieCallback } from "../callbacks/change-tie";
import { MoveCaretCallback } from "../callbacks/move-caret";
import { NoteInputCallback } from "../callbacks/note-input";
import { registerPointerHandlers } from "./pointer-event";
import {
  ArrowHandler,
  BarInputHandler,
  CanvasPointerHandler,
  ChangeAccidentalHandler,
  ChangeBeamHandler,
  ChangeNoteRestHandler,
  GrayPointerHandler,
  KeyboardDragHandler,
  KeyPressHandler,
  NoteInputHandler,
  TieHandler,
} from "./pointer-handlers";

export const registerCallbacks = () => {
  // for tablet
  registerPointerHandlers(
    ["keyboardBottom", "keyboardHandle"],
    [new KeyboardDragHandler()]
  );
  registerPointerHandlers(
    ["changeNoteRest"],
    [new ChangeNoteRestHandler(new ChangeNoteRestCallback())]
  );
  registerPointerHandlers(
    ["changeBeam"],
    [new ChangeBeamHandler(new ChangeBeamCallback())]
  );
  registerPointerHandlers(["grayKey", "whiteKey"], [new KeyPressHandler()]);
  registerPointerHandlers(
    ["note", "rest", "backspace"],
    [new NoteInputHandler(new NoteInputCallback())]
  );
  registerPointerHandlers(
    ["toLeft", "toRight"],
    [new ArrowHandler(new MoveCaretCallback())]
  );
  registerPointerHandlers(
    ["bars", "candidate"],
    [new BarInputHandler(new BarInputCallback())]
  );
  registerPointerHandlers(
    ["accidentals"],
    [new ChangeAccidentalHandler(new ChangeAccidentalCallback())]
  );
  registerPointerHandlers([], [new CanvasPointerHandler(new CanvasCallback())]);
  registerPointerHandlers(
    ["changeTie"],
    [new TieHandler(new ChangeTieCallback())]
  );
};
