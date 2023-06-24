import { UNIT } from "./font/bravura";
import { offsetBBox, Point } from "./geometry";
import { paintCaret, paintStaff, paintStyle, resetCanvas } from "./paint";
import { getScale, getStaffOrigin } from "./score-preferences";
import {
  addCaret,
  getCurrentCaret,
  addElementBBoxes,
  getElements,
  getPointing,
  initElementBBoxes,
  setStyles,
  getEditingStaffId,
  getAllStaffs,
  getStyles,
  getCarets,
  getCurrentCaretIdx,
  clearCaretsMap,
} from "./score-states";
import { determineCaretStyle, determinePaintElementStyle } from "./style/style";

let isUpdated = false;
export const getShouldRender = () => isUpdated;
export const setUpdated = (v: boolean) => {
  isUpdated = v;
};

export const updateMain = () => {
  clearCaretsMap();
  initElementBBoxes();
  for (const [id] of getAllStaffs()) {
    setStyles(
      id,
      determinePaintElementStyle(
        getElements(id),
        UNIT,
        { clef: { type: "g" } },
        getPointing()
      )
    );
    updateUIState(id);
  }
  setUpdated(true);
};

const updateUIState = (id: number) => {
  let cursor = 0;
  for (const style of getStyles(id)) {
    console.log("style", style);
    const { width, element, caretOption, bbox, index: elIdx } = style;
    addElementBBoxes({ bbox: offsetBBox(bbox, { x: cursor }), elIdx });
    if (caretOption) {
      addCaret(id, determineCaretStyle(caretOption, width, cursor));
    }
    if (element.type !== "beam" && element.type !== "tie") {
      cursor += width;
    }
  }
};

export const renderStaff = (ctx: CanvasRenderingContext2D, position: Point) => {
  resetCanvas({
    ctx,
    width: window.innerWidth,
    height: window.innerHeight,
    fillStyle: "#fff",
  });
  ctx.save();
  ctx.scale(getScale(), getScale());
  for (const [id, staff] of getAllStaffs()) {
    ctx.save();
    ctx.translate(staff.position.x, staff.position.y);
    paintStaff(ctx, 0, 0, UNIT * 100, 1);
    for (const style of getStyles(id)) {
      paintStyle(ctx, style);
      // paintBBox(ctx, style.bbox); // debug
      if (style.element.type !== "beam" && style.element.type !== "tie") {
        ctx.translate(style.width, 0);
      }
    }
    ctx.restore();
  }
  ctx.restore();
  renderCaret(ctx);
};

const renderCaret = (mainCtx: CanvasRenderingContext2D) => {
  mainCtx.save();
  mainCtx.scale(getScale(), getScale());
  for (const [id, staff] of getAllStaffs()) {
    mainCtx.save();
    mainCtx.translate(staff.position.x, staff.position.y);
    paintCaret({
      ctx: mainCtx,
      scale: 1,
      caret: getCurrentCaret(id),
    });
    mainCtx.restore();
  }
  mainCtx.restore();
};
