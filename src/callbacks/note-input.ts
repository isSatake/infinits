import { inputMusicalElement } from "../score-updater";
import { determinePaintElementStyle } from "../style/style";
import { bStaffHeight, UNIT } from "../font/bravura";
import { CanvasManager } from "../canvas";
import {
  Duration,
  durations,
  MusicalElement,
  Pitch,
  Tie,
} from "../notation/types";
import { initCanvas, paintStaff, paintStyle, resetCanvas } from "../paint";
import { sortPitches } from "../pitch";
import {
  getPreviewHeight,
  getPreviewScale,
  getPreviewWidth,
} from "../score-preferences";
import { updateMain } from "../score-renderer";
import {
  getAccidentalMode,
  getBeamMode,
  getCaretByIndex,
  getCurrentCaret,
  getIsNoteInputMode,
  getElements,
  getTieMode,
  setLastEditedIndex,
  setElements,
  getEditingStaffId,
  getAllStaffs,
  getLastStaffId,
  getCurrentCaretIdx,
  setCurrentCaretIdx,
} from "../score-states";
import { BeamModes } from "../input-modes";

// このコールバックはキーハンドラだけじゃなくてMIDIキーとか普通のキーボードとかからも使う想定
export interface INoteInputCallback {
  startPreview(duration: Duration, downX: number, downY: number): void;

  updatePreview(duration: Duration, dy: number): void;

  commit(duration: Duration, dy?: number): void;

  backspace(): void;

  finish(): void;
}

let copiedElements;
export class NoteInputCallback implements INoteInputCallback {
  private previewCanvas: HTMLCanvasElement;
  private previewCtx: CanvasRenderingContext2D;

  constructor() {
    const { canvas, ctx } = CanvasManager.getById("previewCanvas");
    this.previewCanvas = canvas;
    this.previewCtx = ctx;
  }

  // (start|update)Preview, commitを共通化したい。
  // 基本的にelementを生成するだけだが
  // tieでは直前の音をいじるので
  // 「音を追加」「音を変更」をデータ化できるといいんだけど。reducerみたく
  // applyBeamももうちょいスマートに書けるんじゃないかな？
  startPreview(duration: Duration, downX: number, downY: number) {
    const id = getEditingStaffId();
    if (id === undefined) {
      return;
    }
    const left = downX - getPreviewWidth() / 2;
    const top = downY - getPreviewHeight() / 2;
    initCanvas({
      leftPx: left,
      topPx: top,
      width: getPreviewWidth(),
      height: getPreviewHeight(),
      _canvas: this.previewCanvas,
    });
    copiedElements = [...getElements(id)];
    const newPitch = {
      pitch: pitchByDistance(getPreviewScale(), 0, 6),
      accidental: getAccidentalMode(),
    };
    let tie: Tie | undefined;
    if (
      getTieMode() &&
      getCurrentCaretIdx(id) > 0 &&
      getCurrentCaretIdx(id) % 2 === 0
    ) {
      const prevEl = copiedElements[getCurrentCaretIdx(id) / 2 - 1];
      if (
        prevEl?.type === "note" &&
        prevEl.pitches[0].pitch === newPitch.pitch &&
        prevEl.pitches[0].accidental === newPitch.accidental
      ) {
        prevEl.tie = "start";
        tie = "stop";
      }
    }
    const element: MusicalElement = getIsNoteInputMode()
      ? {
          type: "note",
          duration,
          pitches: [newPitch],
          tie,
        }
      : {
          type: "rest",
          duration,
        };
    if (getCurrentCaretIdx(id) > 0 && getCurrentCaretIdx(id) % 2 !== 0) {
      const oldIdx =
        getCurrentCaretIdx(id) === 1 ? 0 : (getCurrentCaretIdx(id) - 1) / 2;
      const oldEl = copiedElements[oldIdx];
      if (
        element.type === "note" &&
        oldEl.type === "note" &&
        element.duration === oldEl.duration
      ) {
        element.pitches = sortPitches([...oldEl.pitches, ...element.pitches]);
      }
    }
    updatePreview(id, this.previewCtx, copiedElements, getBeamMode(), element);
    this.previewCanvas.style.visibility = "visible";
  }

  updatePreview(duration: Duration, dy: number) {
    const id = getEditingStaffId();
    if (id === undefined) {
      return;
    }
    copiedElements = [...getElements(id)];
    const newPitch = {
      pitch: pitchByDistance(getPreviewScale(), dy, 6),
      accidental: getAccidentalMode(),
    };
    let tie: Tie | undefined;
    if (
      getTieMode() &&
      getCurrentCaretIdx(id) > 0 &&
      getCurrentCaretIdx(id) % 2 === 0
    ) {
      const prevEl = copiedElements[getCurrentCaretIdx(id) / 2 - 1];
      if (
        prevEl?.type === "note" &&
        prevEl.pitches[0].pitch === newPitch.pitch &&
        prevEl.pitches[0].accidental === newPitch.accidental
      ) {
        prevEl.tie = "start";
        tie = "stop";
      }
    }
    const element: MusicalElement = getIsNoteInputMode()
      ? {
          type: "note",
          duration,
          pitches: [newPitch],
          tie,
        }
      : {
          type: "rest",
          duration,
        };
    if (getCurrentCaretIdx(id) > 0 && getCurrentCaretIdx(id) % 2 !== 0) {
      const oldIdx =
        getCurrentCaretIdx(id) === 1 ? 0 : (getCurrentCaretIdx(id) - 1) / 2;
      const oldEl = copiedElements[oldIdx];
      if (
        element.type === "note" &&
        oldEl.type === "note" &&
        element.duration === oldEl.duration
      ) {
        element.pitches = sortPitches([...oldEl.pitches, ...element.pitches]);
      }
    }
    updatePreview(id, this.previewCtx, copiedElements, getBeamMode(), element);
  }

  commit(duration: Duration, dy?: number) {
    const id = getEditingStaffId();
    if (id === undefined) {
      return;
    }
    let newElement: MusicalElement;
    const newPitch = {
      pitch: pitchByDistance(getPreviewScale(), dy ?? 0, 6),
      accidental: getAccidentalMode(),
    };
    let tie: Tie | undefined;
    if (
      getTieMode() &&
      getCurrentCaretIdx(id) > 0 &&
      getCurrentCaretIdx(id) % 2 === 0
    ) {
      const prevEl = getElements(id)[getCurrentCaretIdx(id) / 2 - 1];
      if (
        prevEl?.type === "note" &&
        prevEl.pitches[0].pitch === newPitch.pitch &&
        prevEl.pitches[0].accidental === newPitch.accidental
      ) {
        prevEl.tie = "start";
        tie = "stop";
      }
    }
    if (getIsNoteInputMode()) {
      newElement = {
        type: "note",
        duration,
        pitches: [newPitch],
        tie,
      };
    } else {
      newElement = {
        type: "rest",
        duration,
      };
    }
    const { elements, insertedIndex, caretAdvance } = inputMusicalElement({
      caretIndex: getCurrentCaretIdx(id),
      elements: getElements(id),
      newElement,
      beamMode: getBeamMode(),
    });
    setLastEditedIndex(id, insertedIndex);
    setCurrentCaretIdx(id, getCurrentCaretIdx(id) + caretAdvance);
    setElements(id, elements);
    updateMain();
    copiedElements = [];
  }

  backspace() {
    const id = getEditingStaffId();
    if (id === undefined) {
      return;
    }
    const targetElIdx = getCurrentCaret(id).elIdx;
    if (targetElIdx < 0) {
      return;
    }
    const deleted = getElements(id).splice(targetElIdx, 1)[0];
    if (deleted.type === "note") {
      const left = getElements(id)[targetElIdx - 1];
      const right = getElements(id)[targetElIdx];
      if (deleted.beam === "begin" && right?.type === "note") {
        right.beam = "begin";
      } else if (deleted.beam === "end" && left?.type === "note") {
        left.beam = "end";
      }
    }

    // 削除後のcaret位置を計算
    let t = getCurrentCaretIdx(id) - 1;
    while (t > -1) {
      if (t === 0) {
        setCurrentCaretIdx(id, 0);
        t = -1;
      } else if (getCaretByIndex(id, t).elIdx !== targetElIdx) {
        setCurrentCaretIdx(id, t);
        t = -1;
      } else {
        t--;
      }
    }

    updateMain();
  }

  finish() {
    this.previewCanvas.style.visibility = "hidden";
  }
}

const pitchByDistance = (scale: number, dy: number, origin: Pitch): Pitch => {
  const unitY = (UNIT / 2) * scale;
  return Math.round(dy / unitY + origin);
};

const durationByDistance = (
  scale: number,
  dx: number,
  origin: Duration
): Duration => {
  const unitX = UNIT * 2 * scale;
  const _di = Math.round(dx / unitX + durations.indexOf(origin));
  const di = Math.min(Math.max(_di, 0), 6);
  return durations[di];
};

const updatePreview = (
  id: number,
  previewCtx: CanvasRenderingContext2D,
  baseElements: MusicalElement[],
  beamMode: BeamModes,
  newElement: MusicalElement
) => {
  console.log("preview", "start");
  resetCanvas({
    ctx: previewCtx,
    width: getPreviewWidth(),
    height: getPreviewHeight(),
    fillStyle: "#fff",
  });
  const { elements: preview, insertedIndex } = inputMusicalElement({
    caretIndex: getCurrentCaretIdx(id),
    elements: baseElements,
    newElement,
    beamMode,
  });
  console.log("insertedIdx", insertedIndex);
  console.log("preview", preview);
  // B4がcanvasのvertical centerにくるように
  const _topOfStaff =
    getPreviewHeight() / 2 - (bStaffHeight * getPreviewScale()) / 2;
  const styles = [...determinePaintElementStyle(preview, UNIT)];
  const elIdxToX = new Map<number, number>();
  let cursor = 0;
  for (const style of styles) {
    const { width, element, index } = style;
    console.log("style", style);
    if (index !== undefined) {
      elIdxToX.set(index, cursor + width / 2);
    }
    if (element.type !== "beam" && element.type !== "tie") {
      cursor += width;
    }
  }

  console.log("elIdxToX", elIdxToX);

  // paint staff
  previewCtx.save();
  // x: 左端 y: 中心
  previewCtx.translate(0, _topOfStaff);
  previewCtx.scale(getPreviewScale(), getPreviewScale());
  paintStaff(previewCtx, 0, 0, UNIT * 100, 1);
  previewCtx.restore();

  // paint elements
  previewCtx.save();
  // x: 中心, y: 中心
  previewCtx.translate(getPreviewWidth() / 2, _topOfStaff);
  previewCtx.scale(getPreviewScale(), getPreviewScale());
  // x: previewの中心
  const centerX = elIdxToX.get(insertedIndex)!;
  console.log("centerX", centerX);
  previewCtx.translate(-centerX, 0);
  for (const style of styles) {
    const { width, element } = style;
    paintStyle(previewCtx, style);
    if (element.type !== "beam" && element.type !== "tie") {
      previewCtx.translate(width, 0);
    }
  }
  previewCtx.restore();
  console.log("preview", "end");
};
