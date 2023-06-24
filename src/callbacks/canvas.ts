import { UNIT } from "../font/bravura";
import { isPointInBBox, offsetBBox, Point, scalePoint } from "../geometry";
import { getScale, getStaffOrigin } from "../score-preferences";
import { setUpdated, updateMain } from "../score-renderer";
import {
  addStaff,
  getElementBBoxes,
  getPointing,
  getStyles,
  setEditingStaffId,
  setPointing,
  setStaff,
  setStyles,
} from "../score-states";
import { determinePaintElementStyle } from "../style/style";

export interface ICanvasCallback {
  onMove(htmlPoint: Point): void;
  onDoubleClick(htmlPoint: Point): void;
}

// TODO 命名
export class CanvasCallback implements ICanvasCallback {
  constructor() {}

  onMove(htmlPoint: Point) {
    let nextPointing = undefined;
    for (let i in getElementBBoxes()) {
      // const { type } = getStyles()[i].element;
      // if (type === "gap" || type === "beam" || type === "tie") {
      //   continue;
      // }
      // if (
      //   isPointInBBox(
      //     scalePoint(htmlPoint, 1 / getScale()),
      //     offsetBBox(getElementBBoxes()[i].bbox, getStaffOrigin())
      //   )
      // ) {
      //   const { elIdx } = getElementBBoxes()[i];
      //   if (elIdx !== undefined) {
      //     nextPointing = { index: elIdx, type };
      //   }
      // }
    }
    if (getPointing() !== nextPointing) {
      setPointing(nextPointing);
      updateMain();
    }
  }

  onDoubleClick(htmlPoint: Point) {
    const id = addStaff({
      clef: { type: "g" },
      position: scalePoint(htmlPoint, 1 / getScale()),
    });
    console.log("onDoubleClick", id);
    setEditingStaffId(id);
    updateMain();
  }
}
