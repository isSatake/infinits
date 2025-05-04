import { bStaffLineWidth, Path, UNIT } from "@/font/bravura";
import { ClefLayout, StaffLayout } from "@/layout/new/types";
import { getClefPath } from "@/layout/pitch";
import { BBox } from "@/lib/geometry";

export const paint = (p: {
  layout: StaffLayout;
  ctx: CanvasRenderingContext2D;
}) => {
  const { ctx, layout } = p;
  ctx.save();
  paintStaff(p);
  for (const child of layout.children) {
    if (child.type === "clef") {
      paintClef({ ctx, layout: child });
    }
  }
  ctx.restore();
};

const paintStaff = (p: {
  layout: StaffLayout;
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
    ctx.lineTo(layout.width, y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
};

const paintClef = (p: {
  layout: ClefLayout;
  ctx: CanvasRenderingContext2D;
}) => {
  const { ctx, layout } = p;
  const { path } = getClefPath(layout.clef);
  ctx.save();
  ctx.setTransform(layout.mtx);
  paintBravuraPath({ ctx, color: layout.color, path });
  ctx.restore();
};

// debug
export const paintBBox = (
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
