import { DefaultMap } from "./lib/default-map";

type CanvasHolder = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
};

export class CanvasManager {
  private static canvasMap = new DefaultMap<string, CanvasHolder>(
    (id: string) => getCanvasById(id)
  );
  static getById(id: string) {
    return this.canvasMap.get(id);
  }
}

const getCanvasById = (id: string): CanvasHolder => {
  const canvas = document.getElementById(id) as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;
  return { canvas, ctx };
};
