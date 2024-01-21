import { getTieMode, setTieMode } from "../score-states";
import { TieModes } from "../input-modes";

export interface IChangeTieCallback {
  getMode(): TieModes;
  change(next: TieModes): void;
}

export class ChangeTieCallback implements IChangeTieCallback {
  constructor() {}

  getMode() {
    return getTieMode();
  }

  change(v: TieModes) {
    setTieMode(v);
  }
}
