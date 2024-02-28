import { Point } from "./geometry";

let isUpdated = false;
export const getShouldRender = () => isUpdated;
export const setUpdated = (v: boolean) => {
  isUpdated = v;
};

export const updateMain = () => {};

export const renderStaff = (
  ctx: CanvasRenderingContext2D,
  position: Point
) => {};
