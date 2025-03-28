globalThis["Path2D"] = class Path2D implements Path2D {
  addPath(path: Path2D, transform?: DOMMatrix2DInit): void {}
  arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    anticlockwise?: boolean
  ): void {}
  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {}
  bezierCurveTo(
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    x: number,
    y: number
  ): void {}
  closePath(): void {}
  ellipse(
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    rotation: number,
    startAngle: number,
    endAngle: number,
    anticlockwise?: boolean
  ): void {}
  lineTo(x: number, y: number): void {}
  moveTo(x: number, y: number): void {}
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {}
  rect(x: number, y: number, w: number, h: number): void {}
  roundRect(
    x: number,
    y: number,
    w: number,
    h: number,
    radii?: number | DOMPointInit | (number | DOMPointInit)[]
  ): void {}
};
