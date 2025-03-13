import { Path } from "../font/bravura";

export type Point = { x: number; y: number };
export type BBox = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};
export type Size = { width: number; height: number };

export const magnitude = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const scalePoint = (p: Point, scale: number): Point => {
  return { x: p.x * scale, y: p.y * scale };
};

export const addPoint = (p1: Point, p2: Point): Point => {
  return { x: p1.x + p2.x, y: p1.y + p2.y };
};

export const offsetBBox = (bbox: BBox, offset?: Partial<Point>): BBox => {
  const x = typeof offset?.x === "number" ? offset.x : 0;
  const y = typeof offset?.y === "number" ? offset.y : 0;
  return {
    left: bbox.left + x,
    top: bbox.top + y,
    right: bbox.right + x,
    bottom: bbox.bottom + y,
  };
};

export const getPathBBox = (path: Path, unit: number): BBox => {
  // 左下原点→左上原点に変換
  return {
    left: path.bbox.sw.x * unit,
    top: -path.bbox.ne.y * unit,
    bottom: -path.bbox.sw.y * unit,
    right: path.bbox.ne.x * unit,
  };
};

export const isPointInBBox = (
  { x, y }: Point,
  { left, top, right, bottom }: BBox
): boolean => {
  return left <= x && x <= right && top <= y && y <= bottom;
};

export const scaleSize = (size: Size, scale: number): Size => {
  return { width: size.width * scale, height: size.height * scale };
};

export const distanceToLineSegment = ({
  point,
  start,
  end,
}: {
  point: Point;
  start: Point;
  end: Point;
}): number | undefined => {
  const { x: sx, y: sy } = start;
  const { x: ex, y: ey } = end;
  const { x: px, y: py } = point;

  // ベクトル AB, AP を求める
  const ABx = ex - sx;
  const ABy = ey - sy;
  const APx = px - sx;
  const APy = py - sy;

  // 射影比率 t の計算
  const dotAPAB = APx * ABx + APy * ABy; // AP・AB
  const dotABAB = ABx * ABx + ABy * ABy; // AB・AB
  const t = dotAPAB / dotABAB;

  // 射影点を求める
  const projection = {
    x: sx + t * ABx,
    y: sy + t * ABy,
  };

  // 射影点が線分の外にある場合
  if (t < 0 || t > 1) return;

  return magnitude(projection, point);
};
