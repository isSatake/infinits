import { updateMain } from "./score-renderer";
import { getMatrix, setMatrix } from "./score-states";

export function registerWheelHandler() {
  document.getElementById("mainCanvas")?.addEventListener("wheel", onWheel);
}

function onWheel(ev: WheelEvent) {
  // ev.preventDefault();
  const delta = ev.deltaY / 1000;
  const scale = getMatrix().a;
  console.log("onWheel", "current scale", scale);
  const newScale = (scale + delta) / scale;
  console.log("onWheel", "new scale", newScale);
  const clampedScale = Math.min(Math.max(newScale, 0.5), 2);
  const { x, y } = getMatrix()
    .inverse()
    .transformPoint({ x: ev.offsetX, y: ev.offsetY });
  setMatrix(getMatrix().translate(x, y).scale(clampedScale).translate(-x, -y));
  updateMain();
}
