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
  private tmpMtx: DOMMatrixReadOnly | undefined;
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
    if (!this.tmpMtx) {
      this.tmpMtx = getMatrix();
    }
    const currentPointOnScore = this.tmpMtx.inverse().transformPoint(htmlPoint);
    const downPointOnScore = this.tmpMtx.inverse().transformPoint(downPoint);
    const tx = currentPointOnScore.x - downPointOnScore.x;
    const ty = currentPointOnScore.y - downPointOnScore.y;
    setMatrix(this.tmpMtx.translate(tx, ty));
    updateMain();
  }

  onUp() {
    this.tmpMtx = undefined;
  }
}
