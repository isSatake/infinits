import { registerCallbacks } from "./pointer-event/register-pointer-handlers";
import { CanvasManager } from "./canvas";
import { initCanvas } from "./paint";
import { getPreviewHeight, getPreviewWidth } from "./score-preferences";
import {
  getShouldRender,
  renderScore,
  setUpdated,
  updateMain,
} from "./score-renderer";

window.addEventListener("load", () => {
  console.log("start");
  if ("serviceWorker" in navigator) {
    window.navigator.serviceWorker.register("./sw.js");
  }
  const { canvas: mainCanvas, ctx: mainCtx } =
    CanvasManager.getById("mainCanvas");
  const { canvas: previewCanvas } = CanvasManager.getById("previewCanvas");
  initCanvas({
    leftPx: 0,
    topPx: 0,
    width: window.innerWidth,
    height: window.innerHeight,
    _canvas: mainCanvas,
  });
  initCanvas({
    leftPx: 0,
    topPx: 0,
    width: getPreviewWidth(),
    height: getPreviewHeight(),
    _canvas: previewCanvas,
  });
  registerCallbacks();
  updateMain();
  scheduleRenderScore(mainCtx);
});

const scheduleRenderScore = (ctx: CanvasRenderingContext2D) => {
  requestAnimationFrame(() => {
    if (getShouldRender()) {
      renderScore(ctx);
      setUpdated(false);
    }
    scheduleRenderScore(ctx);
  });
};
