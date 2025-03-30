import { PaintNode, PaintNodeMap } from "./types";

export const insertTieStyles = (nodes: PaintNode[]) => {
  const ret = [...nodes];
  const ties: { index: number; style: PaintNodeMap["tie"] }[] = [];
  let _i = 0;
  while (_i < ret.length) {
    const node = ret[_i];
    if (
      node.type === "note" &&
      (node.style.tie === "begin" || node.style.tie === "continue")
    ) {
      let distance = node.width;
      for (let j = _i + 1; j < ret.length; j++) {
        const _style = ret[j];
        if (
          _style.type === "note" &&
          (_style.style.tie === "end" || _style.style.tie === "continue")
        ) {
          ret.splice(_i, 0, determineTieStyle(node, distance));
          _i = j;
          break;
        } else {
          distance += _style.width;
        }
      }
    }
    _i++;
  }
  for (let { index, style } of ties) {
    ret.splice(index, 0, style);
  }
  return ret;
};

export const determineTieStyle = (
  start: PaintNodeMap["note"],
  width: number
): PaintNodeMap["tie"] => {
  const startHead = start.children.find((e) => e.type === "noteHead")!;
  const position = { ...startHead.style.tie, y: startHead.style.tie.y - 70 };
  const style = {
    cpLow: { x: width / 2, y: 120 },
    cpHigh: { x: width / 2, y: 180 },
    end: { x: width, y: 0 },
  };
  const bbox = {
    left: 0,
    right: width,
    top: 0,
    bottom: 180,
  };
  return {
    type: "tie",
    style,
    width,
    height: bbox.bottom - bbox.top,
    bbox,
    mtx: new DOMMatrix().translate(start.mtx.e, start.mtx.f),
  };
};
