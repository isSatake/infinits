import { Accidental } from "@/core/types";
import {
  accidentalPathMap,
  downFlagMap,
  noteHeadByDuration,
  restPathMap,
  upFlagMap,
} from "../core/constants";
import {
  bLedgerLineThickness,
  bStaffLineWidth,
  Path,
  repeatDotRadius,
  UNIT,
} from "../font/bravura";
import { getClefPath } from "../layout/pitch";
import {
  BarStyle,
  BeamStyle,
  CaretStyle,
  ClefStyle,
  ConnectionStyle,
  FileStyle,
  NoteAccidentalElement,
  NoteFlagElement,
  NoteHeadElement,
  NoteLedgerElement,
  NoteStemElement,
  NoteStyle,
  PaintElement,
  PaintStyle,
  RestStyle,
  TextStyle,
  TieStyle,
} from "../layout/types";
import { addPoint, BBox, Point } from "../lib/geometry";

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

const paintBravuraPath = ({
  ctx,
  left,
  top,
  scale,
  path,
  color,
}: {
  ctx: CanvasRenderingContext2D;
  left: number;
  top: number;
  scale: number;
  path: Path;
  color?: string;
}) => {
  ctx.save();
  ctx.rotate((Math.PI / 180) * 180); // もとのパスは回転している
  ctx.translate(-left, -top); // 回転しているため負の値
  ctx.scale(-scale, scale); // もとのパスは五線の高さを1000としているのでスケールする
  ctx.fillStyle = color ? color : "#000";
  ctx.fill(path.path2d);
  ctx.restore();
};

const paintClef = (
  ctx: CanvasRenderingContext2D,
  clefStyle: ClefStyle,
  left: number
) => {
  const { path, y } = getClefPath(clefStyle.clef);
  paintBravuraPath({
    ctx,
    left,
    scale: 1,
    color: clefStyle.color,
    path,
    top: y,
  });
};

export const paintStaff = (
  ctx: CanvasRenderingContext2D,
  computedWidth: number
) => {
  for (let i = 0; i < 5; i++) {
    const y = UNIT * i;
    ctx.save();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = bStaffLineWidth;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(computedWidth, y);
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
      paintNoteHead(noteEl, ctx, color);
    } else if (noteEl.type === "ledger") {
      paintLedger(noteEl, ctx, color);
    } else if (noteEl.type === "accidental") {
      paintAccidental(noteEl, ctx, color);
    } else if (noteEl.type === "flag") {
      paintFlag(noteEl, ctx, color);
    } else if (noteEl.type === "stem") {
      paintStem(noteEl, ctx, color);
    }
  }
};

const paintNoteHead = (
  head: NoteHeadElement,
  ctx: CanvasRenderingContext2D,
  color: string
) => {
  const { duration, position } = head;
  ctx.save();
  ctx.translate(position.x, position.y);
  const path = noteHeadByDuration(duration);
  paintBravuraPath({ ctx, left: 0, top: 0, scale: 1, path, color });
  ctx.restore();
};

const paintLedger = (
  ledger: NoteLedgerElement,
  ctx: CanvasRenderingContext2D,
  color: string
) => {
  const { width, position } = ledger;
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
};

const paintFlag = (
  flag: NoteFlagElement,
  ctx: CanvasRenderingContext2D,
  color: string
) => {
  const { duration, direction, position } = flag;
  const path =
    direction === "up"
      ? upFlagMap().get(duration)
      : downFlagMap().get(duration);
  if (path) {
    paintBravuraPath({
      ctx,
      left: position.x,
      top: position.y,
      scale: 1,
      path,
      color,
    });
  }
};

const paintStem = (
  stem: NoteStemElement,
  ctx: CanvasRenderingContext2D,
  color: string
) => {
  const { position, width, height } = stem;
  ctx.save();
  ctx.translate(position.x + width / 2, position.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, height);
  ctx.stroke();
  ctx.restore();
};

const paintAccidental = (
  accidental: NoteAccidentalElement,
  ctx: CanvasRenderingContext2D,
  color: string
) => {
  const { position, accidental: acc } = accidental;
  const path = accidentalPathMap().get(acc)!;
  ctx.save();
  ctx.translate(position.x, position.y);
  paintBravuraPath({ ctx, left: 0, top: 0, scale: 1, path, color });
  ctx.restore();
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
  paintBravuraPath({ ctx, left: 0, top: 0, scale: 1, path, color });
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
  style: PaintStyle<PaintElement>
) => {
  const { element } = style;
  const { type } = element;
  if (element.type === "staff") {
    paintStaff(ctx, style.width);
  } else if (type === "connection") {
    paintConnection(ctx, element);
  } else if (type === "clef") {
    paintClef(ctx, element, 0);
  } else if (type === "keySignature") {
    ctx.save();
    for (const acc of element.accs) {
      paintAccidental({
        ctx,
        accidental: acc.type,
        position: { x: acc.position.x, y: acc.position.y },
      });
    }
    ctx.restore();
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
  } else if (type === "text") {
    paintText(ctx, element);
  } else if (type === "file") {
    paintFile(ctx, element);
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
  const offset = addPoint(element.txtPosition, element.offset);
  ctx.save();
  ctx.fillStyle = "#000";
  ctx.font = `${element.fontSize}px ${element.fontFamily}`;
  ctx.textBaseline = element.baseline;
  ctx.translate(offset.x, offset.y);
  ctx.fillText(element.text, 0, 0);
  ctx.restore();
};

const paintFile = (ctx: CanvasRenderingContext2D, element: FileStyle) => {
  ctx.save();
  // 灰色の背景を描画
  ctx.fillStyle = "#E0E0E0";
  ctx.fillRect(0, 0, element.width, element.height);

  // 左端に黒い再生ボタン（三角形）を描画
  ctx.save();
  ctx.translate(element.icon.position.x, element.icon.position.y);
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(element.icon.width, element.icon.height / 2);
  ctx.lineTo(0, element.icon.height);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(element.fileName.txtPosition.x, element.fileName.txtPosition.y);
  ctx.fillStyle = "#000000";
  ctx.font = `${element.fileName.fontSize}px ${element.fileName.fontFamily}`;
  ctx.textBaseline = element.fileName.baseline;
  ctx.fillText(element.fileName.text, 0, 0);
  ctx.restore();

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
