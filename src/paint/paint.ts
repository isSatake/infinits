import {
  accidentalPathMap,
  downFlagMap,
  noteHeadByDuration,
  restPathMap,
  upFlagMap,
} from "../core/constants";
import {
  bClefG,
  bLedgerLineThickness,
  bStaffLineWidth,
  Path,
  repeatDotRadius,
  UNIT,
} from "../font/bravura";
import {
  AccidentalStyle,
  BarLineStyle,
  BeamStyle,
  CaretStyle,
  ConnectionStyle,
  FlagStyle,
  LedgerStyle,
  NoteHeadStyle,
  PaintNode,
  RestStyle,
  StemStyle,
  TextStyle,
  TieStyle,
} from "../layout/types";
import { BBox, Size } from "../lib/geometry";

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

const paintGClef = (ctx: CanvasRenderingContext2D) => {
  paintBravuraPath(ctx, 0, 0, 1, bClefG(), "#000");
};

export const paintStaff = (ctx: CanvasRenderingContext2D, width: number) => {
  for (let i = 0; i < 5; i++) {
    const y = UNIT * i;
    ctx.save();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = bStaffLineWidth;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
};

const paintConnection = (
  ctx: CanvasRenderingContext2D,
  style: ConnectionStyle
) => {
  for (let i = 0; i < 5; i++) {
    const y = UNIT * i;
    ctx.save();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = bStaffLineWidth;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(style.to.x, style.to.y + y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
};

const paintBarline = (ctx: CanvasRenderingContext2D, style: BarLineStyle) => {
  const { lineWidth, height } = style;
  ctx.save();
  ctx.strokeStyle = "#000";
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.stroke();
};

const paintBarDot = (ctx: CanvasRenderingContext2D) => {
  ctx.save();
  const rad = repeatDotRadius;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(0, 0, rad, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, UNIT, rad, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const paintNoteHead = (ctx: CanvasRenderingContext2D, style: NoteHeadStyle) => {
  const { duration } = style;
  ctx.save();
  const path = noteHeadByDuration(duration);
  paintBravuraPath(ctx, 0, 0, 1, path, "#000");
  ctx.restore();
};

const paintLedger = (ctx: CanvasRenderingContext2D, style: LedgerStyle) => {
  const { ledgerWidth: width } = style;
  ctx.save();
  ctx.strokeStyle = "#000";
  ctx.lineWidth = bLedgerLineThickness;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
};

const paintAccidental = (
  ctx: CanvasRenderingContext2D,
  style: AccidentalStyle
) => {
  const { accidental } = style;
  const path = accidentalPathMap().get(accidental)!;
  ctx.save();
  paintBravuraPath(ctx, 0, 0, 1, path, "#000");
  ctx.restore();
};

const paintFlag = (ctx: CanvasRenderingContext2D, style: FlagStyle) => {
  const { duration, direction } = style;
  const path =
    direction === "up"
      ? upFlagMap().get(duration)
      : downFlagMap().get(duration);
  if (path) {
    ctx.save();
    paintBravuraPath(ctx, 0, 0, 1, path, "#000");
    ctx.restore();
  }
};

const paintStem = (ctx: CanvasRenderingContext2D, style: StemStyle) => {
  const { lineWidth, height } = style;
  ctx.save();
  ctx.strokeStyle = "#000";
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
};

const paintRest = (ctx: CanvasRenderingContext2D, { rest }: RestStyle) => {
  const path = restPathMap().get(rest.duration)!;
  ctx.save();
  paintBravuraPath(ctx, 0, 0, 1, path, "#000");
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
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(tie.cpLow.x, tie.cpLow.y, tie.end.x, tie.end.y);
  ctx.quadraticCurveTo(tie.cpHigh.x, tie.cpHigh.y, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

export const paintNode = (ctx: CanvasRenderingContext2D, node: PaintNode) => {
  const { type, style } = node;
  if (type === "staff") {
    paintStaff(ctx, node.width);
  } else if (type === "connection") {
    paintConnection(ctx, style);
  } else if (type === "noteHead") {
    paintNoteHead(ctx, style);
  } else if (type === "accidental") {
    paintAccidental(ctx, style);
  } else if (type === "ledger") {
    paintLedger(ctx, style);
  } else if (type === "flag") {
    paintFlag(ctx, style);
  } else if (type === "stem") {
    paintStem(ctx, style);
  } else if (type === "rest") {
    paintRest(ctx, style);
  } else if (type === "clef") {
    paintGClef(ctx);
  } else if (type === "barLine") {
    paintBarline(ctx, style);
  } else if (type === "barDot") {
    paintBarDot(ctx);
  } else if (type === "beam") {
    paintBeam(ctx, style);
  } else if (type === "tie") {
    paintTie(ctx, style);
  } else if (type === "gap") {
    // no-op
  } else if (type === "text") {
    paintText(ctx, style);
  } else if (type === "file") {
    paintFileBackground(ctx, node);
  } else if (type === "playIcon") {
    paintPlayIcon(ctx, node);
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
  const { x, y, width, height } = caret;
  // const height = bStaffHeight * scale;
  ctx.save();
  ctx.fillStyle = highlighted ? "#FF000055" : "#FF000033";
  ctx.fillRect(x, y, width, height);
  ctx.restore();
};

const paintText = (ctx: CanvasRenderingContext2D, element: TextStyle) => {
  const { fontSize, fontFamily, baseline, offset, text } = element;
  ctx.save();
  ctx.fillStyle = "#000";
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textBaseline = baseline;
  ctx.translate(offset.x, offset.y);
  ctx.fillText(text, 0, 0);
  ctx.restore();
};

const paintFileBackground = (ctx: CanvasRenderingContext2D, size: Size) => {
  ctx.save();
  ctx.fillStyle = "#E0E0E0";
  ctx.fillRect(0, 0, size.width, size.height);
  ctx.restore();
};

const paintPlayIcon = (ctx: CanvasRenderingContext2D, size: Size) => {
  ctx.save();
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size.width, size.height / 2);
  ctx.lineTo(0, size.height);
  ctx.closePath();
  ctx.fill();
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
