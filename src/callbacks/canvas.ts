import { Point, scalePoint } from "../geometry";
import { updateMain } from "../score-renderer";
import {
  addStaff,
  getElementBBoxes,
  getMatrix,
  getPointing,
  setEditingStaffId,
  setMatrix,
  setPointing,
} from "../score-states";

export interface ICanvasCallback {
  onMove(htmlPoint: Point): void;
  onDoubleClick(htmlPoint: Point): void;
  onDrag(htmlPoint: Point, downPoint: Point): void;
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
      position: getMatrix().inverse().transformPoint(htmlPoint),
    });
    console.log("onDoubleClick", id);
    setEditingStaffId(id);
    updateMain();
  }

  onDrag(htmlPoint: Point, downPoint: Point) {
    const _hp = getMatrix().inverse().transformPoint(htmlPoint);
    const _dp = getMatrix().inverse().transformPoint(downPoint);
    // const tx = _hp.x - _dp.x;
    // const ty = _hp.y - _dp.y;
    setMatrix(getMatrix().translate(_hp.x - _dp.x, _hp.y - _dp.y));
    updateMain();
  }
}
