import { Point } from "../geometry";

export class Matrix {
  private dommtx: DOMMatrix;
  constructor(init: number[] = [1, 0, 0, 1, 0, 0]) {
    this.dommtx = new DOMMatrix(init);
  }
  spread(): number[] {
    const { a, b, c, d, e, f } = this.dommtx;
    return [a, b, c, d, e, f];
  }
  clone(): Matrix {
    return new Matrix(this.spread());
  }
  scale(s: number): Matrix {
    this.dommtx.scaleSelf(s);
    return this;
  }
  translate({ x, y }: Point): Matrix {
    this.dommtx.translateSelf(x, y);
    return this;
  }
}
