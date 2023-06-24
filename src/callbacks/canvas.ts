import { Point, scalePoint } from "../geometry";
import { updateMain } from "../score-renderer";
import {
  addStaff,
  getElementBBoxes,
  getMatrix,
  getPointing,
  setEditingStaffId,
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
      position: scalePoint(htmlPoint, 1 / getMatrix().a),
    });
    console.log("onDoubleClick", id);
    setEditingStaffId(id);
    updateMain();
  }

  onDrag(htmlPoint: Point, downPoint: Point) {
    const translated = scalePoint(
      {
        x: htmlPoint.x - downPoint.x,
        y: htmlPoint.y - downPoint.y,
      },
      1 / getMatrix().a
    );
    console.log("onDrag", translated);
  }
}
