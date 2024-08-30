import {
  bClefG,
  bLedgerLineThickness,
  bStaffHeight,
  bStaffLineWidth,
  Path,
  repeatDotRadius,
  UNIT,
} from "./font/bravura";
import { BBox } from "./geometry";
import {
  accidentalPathMap,
  downFlagMap,
  noteHeadByDuration,
  restPathMap,
  upFlagMap,
} from "./notation/constants";
import { StaffStyle } from "./style/types";
import { pitchToY } from "./style/style";
import {
  BarStyle,
  BeamStyle,
  CaretStyle,
  ClefStyle,
  NoteStyle,
  PaintElement,
  PaintElementStyle,
  RestStyle,
  TieStyle,
} from "./style/types";

export const initCanvas = ({
  leftPx,
  topPx,
  width,
  height,
  _canvas,
}: {
  leftPx: number;
  topPx: number;
  width: number;
  height: number;
  _canvas?: HTMLCanvasElement;
}) => {
  const canvas = _canvas ?? document.createElement("canvas");
  canvas.style.position = "absolute";
  canvas.style.top = `${topPx}px`;
  canvas.style.left = `${leftPx}px`;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas#scaling_for_high_resolution_displays
  // iOS PWAで描画されなくなるので一時的にやめる
  canvas.width = width; //* devicePixelRatio;
  canvas.height = height; //* devicePixelRatio;
  canvas.getContext("2d"); //?.scale(devicePixelRatio, devicePixelRatio);
};

const paintBravuraPath = (
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  scale: number,
  path: Path,
  color?: string
) => {
  ctx.save();
  ctx.rotate((Math.PI / 180) * 180); // もとのパスは回転している
  ctx.translate(-left, -top); // 回転しているため負の値
  ctx.scale(-scale, scale); // もとのパスは五線の高さを1000としているのでスケールする
  ctx.fillStyle = color ? color : "#000";
  ctx.fill(path.path2d);
  ctx.restore();
};

const paintGClef = (
  ctx: CanvasRenderingContext2D,
  element: ClefStyle,
  left: number,
  topOfStaff: number
) => {
  const g = pitchToY(topOfStaff, 4, 1);
  paintBravuraPath(ctx, left, g, 1, bClefG(), element.color);
};

export const paintStaff = (
  ctx: CanvasRenderingContext2D,
  style: StaffStyle,
  computedWidth: number
) => {
  for (const line of style.lines) {
    ctx.save();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = line.width;
    ctx.beginPath();
    ctx.moveTo(0, line.y);
    ctx.lineTo(computedWidth, line.y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
};

/**
 * 小節線描画
 */
const paintBarline = (ctx: CanvasRenderingContext2D, element: BarStyle) => {
  const color = element.color ?? "#000";
  for (const el of element.elements) {
    ctx.save();
    if (el.type === "line") {
      ctx.translate(el.position.x + el.lineWidth / 2, el.position.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = el.lineWidth;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, el.height);
      ctx.closePath();
      ctx.stroke();
    } else {
      const rad = repeatDotRadius;
      ctx.translate(el.position.x + rad, el.position.y);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, UNIT, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
};

const paintNote = ({
  ctx,
  element,
}: {
  ctx: CanvasRenderingContext2D;
  element: NoteStyle;
}) => {
  const color = element.color ?? "#000";
  for (const noteEl of element.elements) {
    if (noteEl.type === "head") {
      const { duration, position } = noteEl;
      ctx.save();
      ctx.translate(position.x, position.y);
      const path = noteHeadByDuration(duration);
      paintBravuraPath(ctx, 0, 0, 1, path, color);
      ctx.restore();
    } else if (noteEl.type === "ledger") {
      const { width, position } = noteEl;
      ctx.save();
      ctx.translate(position.x, position.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = bLedgerLineThickness;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(width, 0);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    } else if (noteEl.type === "accidental") {
      const { position, accidental } = noteEl;
      const path = accidentalPathMap().get(accidental)!;
      ctx.save();
      ctx.translate(position.x, position.y);
      paintBravuraPath(ctx, 0, 0, 1, path, color);
      ctx.restore();
    } else if (noteEl.type === "flag") {
      const { duration, direction, position } = noteEl;
      const path =
        direction === "up"
          ? upFlagMap().get(duration)
          : downFlagMap().get(duration);
      if (path) {
        paintBravuraPath(ctx, position.x, position.y, 1, path, color);
      }
    } else if (noteEl.type === "stem") {
      const { position, width, height } = noteEl;
      ctx.save();
      ctx.translate(position.x + width / 2, position.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, height);
      ctx.stroke();
      ctx.restore();
    }
  }
};

const paintRest = ({
  ctx,
  element,
}: {
  ctx: CanvasRenderingContext2D;
  element: RestStyle;
}) => {
  const { rest, position, color } = element;
  const path = restPathMap().get(rest.duration)!;
  ctx.save();
  ctx.translate(position.x, position.y);
  paintBravuraPath(ctx, 0, 0, 1, path, color);
  ctx.restore();
};

const paintBeam = (ctx: CanvasRenderingContext2D, beam: BeamStyle) => {
  ctx.save();
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.moveTo(beam.nw.x, beam.nw.y);
  ctx.lineTo(beam.sw.x, beam.sw.y);
  ctx.lineTo(beam.se.x, beam.se.y);
  ctx.lineTo(beam.ne.x, beam.ne.y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

const paintTie = (ctx: CanvasRenderingContext2D, tie: TieStyle) => {
  ctx.save();
  ctx.fillStyle = "#000";
  ctx.translate(tie.position.x, tie.position.y);
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(tie.cpLow.x, tie.cpLow.y, tie.end.x, tie.end.y);
  ctx.quadraticCurveTo(tie.cpHigh.x, tie.cpHigh.y, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

export const paintStyle = (
  ctx: CanvasRenderingContext2D,
  style: PaintElementStyle<PaintElement>
) => {
  const { element } = style;
  const { type } = element;
  if (element.type === "staff") {
    paintStaff(ctx, element, style.width);
  } else if (type === "clef") {
    paintGClef(ctx, element, 0, 0);
  } else if (type === "note") {
    paintNote({ ctx, element });
  } else if (type === "rest") {
    paintRest({ ctx, element });
  } else if (type === "beam") {
    paintBeam(ctx, element);
  } else if (type === "tie") {
    paintTie(ctx, element);
  } else if (type === "bar") {
    paintBarline(ctx, element);
  } else if (type === "gap") {
    // no-op
  }
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

export const paintCaret = ({
  ctx,
  scale,
  caret,
  highlighted,
}: {
  ctx: CanvasRenderingContext2D;
  scale: number;
  caret: CaretStyle;
  highlighted: boolean;
}) => {
  const { x, y, width } = caret;
  const height = bStaffHeight * scale;
  ctx.save();
  ctx.fillStyle = highlighted ? "#FF000055" : "#FF000033";
  ctx.fillRect(x, y, width, height);
  ctx.restore();
};

export const resetCanvas = ({
  ctx,
  width,
  height,
  fillStyle,
}: {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  fillStyle: string;
}) => {
  ctx.save();
  ctx.fillStyle = fillStyle;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
};

export const resetCanvas2 = ({
  ctx,
  fillStyle,
}: {
  ctx: CanvasRenderingContext2D;
  fillStyle: string;
}) => {
  ctx.save();
  ctx.fillStyle = fillStyle;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
};
