import { Point } from "./org/geometry";
import { PointerState } from "./pointer-state";

type DesktopState =
  | ({ type: "idle" } & DesktopStateProps["idle"])
  | ({ type: "downCanvas" } & DesktopStateProps["downCanvas"])
  | ({ type: "downStaff" } & DesktopStateProps["downStaff"])
  | ({ type: "pan" } & DesktopStateProps["pan"])
  | ({ type: "zoom" } & DesktopStateProps["zoom"])
  | ({ type: "addStaff" } & DesktopStateProps["addStaff"])
  | ({ type: "ctxMenuStaff" } & DesktopStateProps["ctxMenuStaff"])
  | ({ type: "moveStaff" } & DesktopStateProps["moveStaff"])
  | ({ type: "focusStaff" } & DesktopStateProps["focusStaff"]);

export type DesktopStateProps = {
  idle: {};
  downCanvas: { downMtx: DOMMatrix };
  downStaff: { staffId: number; point: Point; offset: Point };
  pan: { downMtx: DOMMatrix; translated: DOMMatrix };
  zoom: { downMtx: DOMMatrix; translated: DOMMatrix };
  addStaff: { point: Point };
  ctxMenuStaff: { staffId: number; htmlPoint: Point };
  moveStaff: { staffId: number; offset: Point; point: Point };
  focusStaff: { staffId: number };
};

export class DesktopStateMachine {
  private _state: DesktopState = { type: "idle" };
  private set state(state: DesktopState) {
    this._state = state;
    console.log("set", state);
    this._onState(state);
  }
  private get state() {
    return this._state;
  }

  constructor() {}

  private _getStaffOnPoint: (
    point: Point
  ) => { staffId: number; offset: Point } | void = () => {};
  set getStaffOnPoint(
    fn: (point: Point) => { staffId: number; offset: Point } | void
  ) {
    this._getStaffOnPoint = fn;
  }

  private _onState = (state: DesktopState) => {};
  set onState(fn: (state: DesktopState) => void) {
    this._onState = fn;
  }

  private _mtx: DOMMatrix = new DOMMatrix();
  set mtx(mtx: DOMMatrix) {
    this._mtx = mtx;
  }

  on = (state: PointerState) => {
    switch (this.state.type) {
      case "idle":
        this.idleHandler(state);
        break;
      case "downCanvas":
        this.downCanvasHandler(state);
        break;
      case "pan":
        this.panHandler(state);
        break;
      case "zoom":
        this.zoomHandler(state);
        break;
      case "addStaff":
        this.addStaffHandler(state);
        break;
      case "downStaff":
        this.downStaffHandler(state);
        break;
      case "ctxMenuStaff":
        this.ctxMenuStaffHandler(state);
        break;
      case "moveStaff":
        this.moveStaffHandler(state);
        break;
      case "focusStaff":
        this.focusStaffHandler(state);
        break;
    }
  };

  private idleHandler = (state: PointerState) => {
    switch (state.type) {
      case "down": {
        const htmlPoint = {
          x: state.down.clientX,
          y: state.down.clientY,
        };
        const point = this._mtx.inverse().transformPoint(htmlPoint);
        const ret = this._getStaffOnPoint(point);
        this.state = ret
          ? { type: "downStaff", point, ...ret }
          : { type: "downCanvas", downMtx: DOMMatrix.fromMatrix(this._mtx) };
      }
    }
  };

  private downCanvasHandler = (state: PointerState) => {
    if (this.state.type !== "downCanvas") {
      return;
    }
    switch (state.type) {
      case "move":
        const diff = {
          x: state.diff.x / this.state.downMtx.a,
          y: state.diff.y / this.state.downMtx.a,
        };
        const translated = this.state.downMtx.translate(diff.x, diff.y);
        this.state = { type: "pan", downMtx: this.state.downMtx, translated };
        break;
      case "idle":
        this.state = { type: "idle" };
        break;
      case "doubleMove":
        {
          const down = { x: state.down.clientX, y: state.down.clientY };
          const dz = state.point.y - down.y;
          const scale = Math.exp(dz / 100);
          const origin = this.state.downMtx.inverse().transformPoint(down);
          const translated = this.state.downMtx
            .translate(origin.x, origin.y)
            .scale(scale, scale)
            .translate(-origin.x, -origin.y);
          this.state = {
            type: "zoom",
            downMtx: this.state.downMtx,
            translated,
          };
        }
        break;
      case "pinch":
        {
          const [d0, d1] = Object.values(state.down).map((ev) => ({
            x: ev.clientX,
            y: ev.clientY,
          }));
          const [p0, p1] = Object.values(state.points).map((ev) => ({
            x: ev.clientX,
            y: ev.clientY,
          }));
          const dm = Math.sqrt((d0.x - d1.x) ** 2 + (d0.y - d1.y) ** 2);
          const pm = Math.sqrt((p0.x - p1.x) ** 2 + (p0.y - p1.y) ** 2);
          const scale = Math.exp((pm - dm) / 100);
          const origin = this.state.downMtx.inverse().transformPoint({
            x: (d0.x + d1.x) / 2,
            y: (d0.y + d1.y) / 2,
          });
          const translated = this.state.downMtx
            .translate(origin.x, origin.y)
            .scale(scale, scale)
            .translate(-origin.x, -origin.y);
          this.state = {
            type: "zoom",
            downMtx: this.state.downMtx,
            translated,
          };
        }
        break;
      case "doubleClick":
        this.state = {
          type: "addStaff",
          point: this._mtx.inverse().transformPoint(state.point),
        };
        break;
    }
  };

  private panHandler = (state: PointerState) => {
    if (this.state.type !== "pan") {
      return;
    }
    switch (state.type) {
      case "move":
        const diff = {
          x: state.diff.x / this.state.downMtx.a,
          y: state.diff.y / this.state.downMtx.d,
        };
        const translated = this.state.downMtx.translate(diff.x, diff.y);
        this.state = { ...this.state, translated };
        break;
      case "idle":
        this.state = { type: "idle" };
        break;
    }
  };

  private zoomHandler = (state: PointerState) => {
    if (this.state.type !== "zoom") {
      return;
    }
    switch (state.type) {
      case "doubleMove":
        const down = { x: state.down.clientX, y: state.down.clientY };
        const dz = state.point.y - down.y;
        const scale = Math.exp(dz / 100);
        const origin = this.state.downMtx.inverse().transformPoint(down);
        const translated = this.state.downMtx
          .translate(origin.x, origin.y)
          .scale(scale, scale)
          .translate(-origin.x, -origin.y);
        this.state = { type: "zoom", downMtx: this.state.downMtx, translated };
        break;
      case "pinch": {
        const [d0, d1] = Object.values(state.down).map((ev) => ({
          x: ev.clientX,
          y: ev.clientY,
        }));
        const [p0, p1] = Object.values(state.points).map((ev) => ({
          x: ev.clientX,
          y: ev.clientY,
        }));
        const dm = Math.sqrt((d0.x - d1.x) ** 2 + (d0.y - d1.y) ** 2);
        const pm = Math.sqrt((p0.x - p1.x) ** 2 + (p0.y - p1.y) ** 2);
        const scale = Math.exp((pm - dm) / 100);
        const downCenter = this.state.downMtx.inverse().transformPoint({
          x: (d0.x + d1.x) / 2,
          y: (d0.y + d1.y) / 2,
        });
        const origin = this.state.downMtx.inverse().transformPoint({
          x: (p0.x + p1.x) / 2,
          y: (p0.y + p1.y) / 2,
        });
        const originDiff = {
          x: origin.x - downCenter.x,
          y: origin.y - downCenter.y,
        };
        const translated = this.state.downMtx
          .translate(origin.x, origin.y)
          .scale(scale, scale)
          .translate(-origin.x, -origin.y)
          .translate(originDiff.x, originDiff.y);
        this.state = {
          type: "zoom",
          downMtx: this.state.downMtx,
          translated,
        };
        break;
      }
      case "idle":
        this.state = { type: "idle" };
        break;
    }
  };

  private addStaffHandler = (state: PointerState) => {
    switch (state.type) {
      case "idle":
        this.state = { type: "idle" };
        break;
    }
  };

  private downStaffHandler = (state: PointerState) => {
    if (this.state.type !== "downStaff") {
      return;
    }
    switch (state.type) {
      case "idle":
        this.state = { type: "idle" };
        break;
      case "longDown":
        const htmlPoint = { x: state.down.clientX, y: state.down.clientY };
        this.state = {
          ...this.state,
          htmlPoint,
          type: "ctxMenuStaff",
        };
        break;
      case "move":
        this.state = {
          ...this.state,
          type: "moveStaff",
          point: this._mtx.inverse().transformPoint(state.point),
        };
        break;
      case "click":
        this.state = { ...this.state, type: "focusStaff" };
        break;
    }
  };

  // done ctx menuはPointerState関係ない。どう書く？promiseでも返す？
  // 別のstaffでlong downしたらctx menu継続したいが、downが先に来てしまう
  private ctxMenuStaffHandler = (state: PointerState) => {
    switch (state.type) {
      case "down":
        this.state = { type: "idle" };
        break;
    }
  };

  private moveStaffHandler = (state: PointerState) => {
    switch (state.type) {
      case "move":
        if (this.state.type !== "moveStaff") {
          return;
        }
        this.state = {
          ...this.state,
          point: this._mtx.inverse().transformPoint(state.point),
        };
        break;
      case "idle":
        this.state = { type: "idle" };
        break;
    }
  };

  private focusStaffHandler = (state: PointerState) => {
    switch (state.type) {
      case "idle":
        this.state = { type: "idle" };
        break;
    }
  };
}
