import { Point, magnitude } from "./org/geometry";

type State =
  | { type: "idle" }
  | { type: "down"; down: React.PointerEvent }
  | { type: "pan"; down: React.PointerEvent }
  | { type: "singleTap" }
  | { type: "doubleDown"; down: React.PointerEvent }
  | { type: "zoom"; down: React.PointerEvent };

export class CanvasHandler {
  private static THRESHOLD_IDLE = 300;
  private static THRESHOLD_MOVE = 10;

  private idleTimer: number = -1;

  private _state: State = { type: "idle" };
  private set state(state: State) {
    this._state = state;
    console.log("set", state.type);
  }
  private get state() {
    return this._state;
  }

  constructor() {}

  private _onIdle: () => void = () => {};
  set onIdle(fn: () => void) {
    this._onIdle = fn;
  }

  private _onDown: () => void = () => {};
  set onDown(fn: () => void) {
    this._onDown = fn;
  }

  private _onClick: (point: Point) => void = () => {};
  set onClick(fn: (point: Point) => void) {
    this._onClick = fn;
  }

  private _onPan: (dx: number, dy: number, down: Point) => void = () => {};
  set onPan(fn: (dx: number, dy: number, down: Point) => void) {
    this._onPan = fn;
  }

  private _onDoubleZoom: (point: Point, dz: number) => void = () => {};
  set onDoubleZoom(fn: (point: Point, dz: number) => void) {
    this._onDoubleZoom = fn;
  }

  private _onDoubleClick: (point: Point) => void = () => {};
  set onDoubleClick(fn: (point: Point) => void) {
    this._onDoubleClick = fn;
  }

  on(evType: "down" | "move" | "up", ev: React.PointerEvent) {
    console.log(this.state.type, `-> on-${evType}`);
    switch (this.state.type) {
      case "idle":
        this.idleHandler.get(evType)?.(ev);
        break;
      case "down":
        this.downHandler.get(evType)?.(ev, this.state.down);
        break;
      case "pan":
        this.panHandler.get(evType)?.(ev, this.state.down);
        break;
      case "singleTap":
        this.singleTapHandler.get(evType)?.(ev);
        break;
      case "doubleDown":
        this.doubleDownHandler.get(evType)?.(ev, this.state.down);
        break;
      case "zoom":
        this.zoomHandler.get(evType)?.(ev, this.state.down);
        break;
    }
  }
  private idleHandler = new Map([
    [
      "down",
      (ev: React.PointerEvent) => {
        this.state = { type: "down", down: ev };
        this._onDown();
      },
    ],
  ]);

  private downHandler = new Map([
    [
      "move",
      (ev: React.PointerEvent, down: React.PointerEvent) => {
        if (
          magnitude(
            { x: ev.clientX, y: ev.clientY },
            { x: down.clientX, y: down.clientY }
          ) > CanvasHandler.THRESHOLD_MOVE
        ) {
          this.clearIdleTimer();
          this.state = { type: "pan", down };
        }
      },
    ],
    [
      "up",
      (ev: React.PointerEvent) => {
        this.state = { type: "singleTap" };
        this.setIdle(true, () =>
          this._onClick({ x: ev.clientX, y: ev.clientY })
        );
      },
    ],
  ]);

  private panHandler = new Map([
    [
      "move",
      (ev: React.PointerEvent, down: React.PointerEvent) => {
        this._onPan(ev.clientX - down.clientX, ev.clientY - down.clientY, {
          x: down.clientX,
          y: down.clientY,
        });
      },
    ],
    ["up", () => this.setIdle(false)],
  ]);

  private singleTapHandler = new Map([
    [
      "down",
      (ev: React.PointerEvent) => {
        this.state = { type: "doubleDown", down: ev };
        this.clearIdleTimer();
      },
    ],
  ]);

  private doubleDownHandler = new Map([
    [
      "move",
      (ev: React.PointerEvent, down: React.PointerEvent) => {
        if (
          magnitude(
            { x: ev.clientX, y: ev.clientY },
            { x: down.clientX, y: down.clientY }
          ) > CanvasHandler.THRESHOLD_MOVE
        ) {
          this.state = { type: "zoom", down };
        }
      },
    ],
    [
      "up",
      (ev: React.PointerEvent) => {
        this._onDoubleClick({ x: ev.clientX, y: ev.clientY });
        this.setIdle(false);
      },
    ],
  ]);

  private zoomHandler = new Map([
    [
      "move",
      (ev: React.PointerEvent, down: React.PointerEvent) => {
        this._onDoubleZoom(
          { x: down.clientX, y: down.clientY },
          ev.clientY - down.clientY
        );
      },
    ],
    ["up", () => this.setIdle(false)],
  ]);

  private setIdle = (shouldDelay: boolean, fn?: () => void) => {
    const callback = () => {
      fn?.();
      this.state = { type: "idle" };
      this._onIdle();
      this.clearIdleTimer();
    };
    if (shouldDelay) {
      this.idleTimer = window.setTimeout(
        callback,
        CanvasHandler.THRESHOLD_IDLE
      );
    } else {
      callback();
    }
  };

  private clearIdleTimer = () => {
    window.clearTimeout(this.idleTimer);
    this.idleTimer = -1;
  };
}
