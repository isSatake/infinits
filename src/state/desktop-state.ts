import { Point } from "../lib/geometry";
import { PointerState } from "./pointer-state";
import { RootObj } from "@/object";

type DesktopState =
  | ({ type: "idle" } & DesktopStateProps["idle"])
  | ({ type: "downCanvas" } & DesktopStateProps["downCanvas"])
  | ({ type: "downRootObj" } & DesktopStateProps["downRootObj"])
  | ({ type: "pan" } & DesktopStateProps["pan"])
  | ({ type: "zoom" } & DesktopStateProps["zoom"])
  | ({ type: "addStaff" } & DesktopStateProps["addStaff"])
  | ({ type: "ctxMenu" } & DesktopStateProps["ctxMenu"])
  | ({ type: "ctxMenuStaff" } & DesktopStateProps["ctxMenuStaff"])
  | ({ type: "moveRootObj" } & DesktopStateProps["moveRootObj"])
  | ({ type: "focusRootObj" } & DesktopStateProps["focusRootObj"])
  | ({ type: "moveConnection" } & DesktopStateProps["moveConnection"])
  | ({ type: "connectRootObj" } & DesktopStateProps["connectRootObj"]);

export type DesktopStateProps = {
  idle: {};
  downCanvas: { downMtx: DOMMatrix };
  downRootObj: {
    id: number;
    objType: RootObj["type"];
    point: Point;
    offset: Point;
    caretIdx?: number;
  };
  pan: { downMtx: DOMMatrix; translated: DOMMatrix };
  zoom: { downMtx: DOMMatrix; translated: DOMMatrix };
  addStaff: { point: Point };
  ctxMenu: { htmlPoint: Point; desktopPoint: Point };
  ctxMenuStaff: { staffId: number; htmlPoint: Point };
  moveRootObj: { id: number; offset: Point; point: Point };
  focusRootObj: { rootObjId: number; caretIdx?: number };
  moveConnection: { rootObjId: number; point: Point; id?: number };
  connectRootObj: { from: number; to: number };
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

  private _getRootObjOnPoint: (point: Point) => {
    objType: RootObj["type"];
    id: number;
    offset: Point;
    caretIdx?: number;
  } | void = () => {};
  set getRootObjOnPoint(
    fn: (point: Point) => {
      objType: RootObj["type"];
      id: number;
      offset: Point;
      caretIdx?: number;
    } | void
  ) {
    this._getRootObjOnPoint = fn;
  }

  private _getConnectionOnPoint: (
    point: Point
  ) => { id: number; from: number; to: number } | void = () => {};
  set getConnectionOnPoint(
    fn: (point: Point) => { id: number; from: number; to: number } | void
  ) {
    this._getConnectionOnPoint = fn;
  }

  private _isPointingRootObjTail: (
    point: Point,
    staffId: number
  ) => boolean | void = () => {};
  set isPointingRootObjTail(fn: (point: Point, staffId: number) => boolean) {
    this._isPointingRootObjTail = fn;
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
      case "downRootObj":
        this.downRootObjHandler(state);
        break;
      case "ctxMenu":
        this.ctxMenuHandler(state);
        break;
      case "ctxMenuStaff":
        this.ctxMenuStaffHandler(state);
        break;
      case "moveRootObj":
        this.moveRootObjHandler(state);
        break;
      case "focusRootObj":
        this.focusRootObjHandler(state);
        break;
      case "moveConnection":
        this.moveConnectionHandler(state);
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
        const connection = this._getConnectionOnPoint(point);
        if (connection) {
          this.state = {
            type: "moveConnection",
            rootObjId: connection.from,
            point,
            id: connection.id,
          };
        } else {
          const ret = this._getRootObjOnPoint(point);
          if (!ret) {
            this.state = {
              type: "downCanvas",
              downMtx: DOMMatrix.fromMatrix(this._mtx),
            };
          } else {
            if (this._isPointingRootObjTail(point, ret?.id)) {
              this.state = {
                type: "moveConnection",
                rootObjId: ret.id,
                point,
              };
            } else {
              this.state = { type: "downRootObj", point, ...ret };
            }
          }
        }
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
          // TODO zoom handlerと共通化
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
      case "longDown":
        const down = { x: state.down.clientX, y: state.down.clientY };
        this.state = {
          type: "ctxMenu",
          htmlPoint: down,
          desktopPoint: this._mtx.inverse().transformPoint(down),
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
      case "multiDown":
        this.state = {
          type: "zoom",
          downMtx: this.state.translated,
          translated: this.state.translated,
        };
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
      case "keepDown":
        this.state = {
          type: "pan",
          downMtx: this.state.translated,
          translated: this.state.translated,
        };
        break;
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

  private downRootObjHandler = (state: PointerState) => {
    if (this.state.type !== "downRootObj") {
      return;
    }
    switch (state.type) {
      case "idle":
        this.state = { type: "idle" };
        break;
      case "longDown":
        const htmlPoint = { x: state.down.clientX, y: state.down.clientY };
        this.state = {
          // TODO ctxMenuも束ねる
          type: "ctxMenuStaff",
          htmlPoint,
          staffId: this.state.id,
        };
        break;
      case "move":
        this.state = {
          ...this.state,
          type: "moveRootObj",
          point: this._mtx.inverse().transformPoint(state.point),
        };
        break;
      case "click":
        this.state = {
          type: "focusRootObj",
          rootObjId: this.state.id,
          caretIdx: this.state.caretIdx,
        };
        break;
    }
  };

  private ctxMenuHandler = (state: PointerState) => {
    // context menuはmodal dialogなのでPointerStateを取れない。何もしない。
    this.state = { type: "idle" };
  };

  private ctxMenuStaffHandler = (state: PointerState) => {
    switch (state.type) {
      case "down":
        this.state = { type: "idle" };
        break;
    }
  };

  private moveRootObjHandler = (state: PointerState) => {
    switch (state.type) {
      case "move":
        if (this.state.type !== "moveRootObj") {
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

  private focusRootObjHandler = (state: PointerState) => {
    switch (state.type) {
      case "idle":
        this.state = { type: "idle" };
        break;
    }
  };

  private moveConnectionHandler = (state: PointerState) => {
    switch (state.type) {
      case "move":
        if (this.state.type !== "moveConnection") {
          return;
        }
        this.state = {
          ...this.state,
          point: this._mtx.inverse().transformPoint(state.point),
        };
        break;
      case "idle":
        if (this.state.type !== "moveConnection") {
          return;
        }
        const point = this._mtx.inverse().transformPoint(state.point);
        const ret = this._getRootObjOnPoint(point);
        if (ret && this.state.rootObjId !== ret.id) {
          this.state = {
            type: "connectRootObj",
            from: this.state.rootObjId,
            to: ret.id,
          };
        }
        this.state = { type: "idle" };
        break;
    }
  };
}
