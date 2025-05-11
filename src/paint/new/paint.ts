import { bStaffLineWidth, Path, UNIT } from "@/font/bravura";
import { CaretLayout, Layout } from "@/layout/new/types";
import { getClefPath } from "@/layout/pitch";
import { BBox } from "@/lib/geometry";

export const paint = (p: {
  layout: Layout<"staff">;
  ctx: CanvasRenderingContext2D;
}) => {
  const { ctx, layout } = p;
  ctx.save();
  const { a, b, c, d, e, f } = layout.mtx;
  ctx.transform(a, b, c, d, e, f);
  paintStaff({ ctx, layout });
  for (const child of layout.children) {
    ctx.save();
    const { a, b, c, d, e, f } = child.mtx;
    ctx.transform(a, b, c, d, e, f);
    if (child.type === "clef") {
      paintClef({ ctx, layout: child });
    }
    ctx.restore();
  }
  ctx.restore();
};

// for debug
export const paintBBox = (p: {
  layout: Layout<"staff">;
  ctx: CanvasRenderingContext2D;
}) => {
  const { ctx, layout } = p;
  ctx.save();
  const { a, b, c, d, e, f } = layout.mtx;
  ctx.transform(a, b, c, d, e, f);
  _paintBBox(ctx, layout.bbs);
  for (const child of layout.children) {
    ctx.save();
    const { a, b, c, d, e, f } = child.mtx;
    ctx.transform(a, b, c, d, e, f);
    _paintBBox(ctx, child.bbs);
    ctx.restore();
  }
  ctx.restore();
};

const paintStaff = (p: {
  layout: Layout<"staff">;
  ctx: CanvasRenderingContext2D;
}) => {
  const { ctx, layout } = p;
  for (let i = 0; i < 5; i++) {
    const y = UNIT * i;
    ctx.save();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = bStaffLineWidth;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(layout.properties.width, y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
};

const paintClef = (p: {
  layout: Layout<"clef">;
  ctx: CanvasRenderingContext2D;
}) => {
  const { ctx, layout } = p;
  const { path } = getClefPath(layout.properties.clef);
  ctx.save();
  paintBravuraPath({ ctx, color: layout.color, path });
  ctx.restore();
};

export const paintCaret = (p: {
  ctx: CanvasRenderingContext2D;
  caret: CaretLayout;
  highlighted: boolean;
}) => {
  const { ctx, caret, highlighted } = p;
  const { x, y, width, height } = caret;
  ctx.save();
  ctx.fillStyle = highlighted ? "#FF000055" : "#FF000033";
  ctx.fillRect(x, y, width, height);
  ctx.restore();
};

const _paintBBox = (
  ctx: CanvasRenderingContext2D,
  bbox: BBox,
  color?: string
) => {
  ctx.save();
  ctx.strokeStyle = color ?? "#FF0000";
  ctx.strokeRect(
    bbox.left,
    bbox.top,
    bbox.right - bbox.left,
    bbox.bottom - bbox.top
  );
  ctx.restore();
};

const paintBravuraPath = (p: {
  ctx: CanvasRenderingContext2D;
  path: Path;
  color?: string;
}) => {
  const { ctx, path, color } = p;
  ctx.save();
  ctx.rotate((Math.PI / 180) * 180); // もとのパスは回転している
  ctx.translate(-1, -1); // 回転しているため負の値
  ctx.scale(-1, 1);
  ctx.fillStyle = color ? color : "#000";
  ctx.fill(path.path2d);
  ctx.restore();
};
