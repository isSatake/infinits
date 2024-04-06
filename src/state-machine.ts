import { Point, magnitude } from "./org/geometry";

type State =
  | { type: "idle" }
  | { type: "down"; down: React.PointerEvent }
  | { type: "longDown"; down: React.PointerEvent }
  | { type: "singleMove"; down: React.PointerEvent }
  | { type: "singleTap" }
  | { type: "doubleDown"; down: React.PointerEvent }
  | { type: "doubleMove"; down: React.PointerEvent };

export class PointerEventStateMachine {
  private static THRESHOLD_IDLE = 300;
  private static THRESHOLD_MOVE = 10;

  private idleTimer: number = -1;
  private longDownTimer: number = -1;

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

  /**
   * @returns true if the event is consumed
   */
  private _onDown: (point: Point) => boolean = () => false;
  set onDown(fn: (point: Point) => boolean) {
    this._onDown = fn;
  }

  private _onLongDown: (point: Point) => void = () => {};
  set onLongDown(fn: (point: Point) => void) {
    this._onLongDown = fn;
  }

  private _onClick: (point: Point) => void = () => {};
  set onClick(fn: (point: Point) => void) {
    this._onClick = fn;
  }

  private _onSingleMove: (
    dx: number,
    dy: number,
    point: Point,
    down: Point
  ) => void = () => {};
  set onSingleMove(
    fn: (dx: number, dy: number, point: Point, down: Point) => void
  ) {
    this._onSingleMove = fn;
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
      case "longDown":
        this.longDownHandler.get(evType)?.();
        break;
      case "singleMove":
        this.panHandler.get(evType)?.(ev, this.state.down);
        break;
      case "singleTap":
        this.singleTapHandler.get(evType)?.(ev);
        break;
      case "doubleDown":
        this.doubleDownHandler.get(evType)?.(ev, this.state.down);
        break;
      case "doubleMove":
        this.zoomHandler.get(evType)?.(ev, this.state.down);
        break;
    }
  }
  private idleHandler = new Map([
    [
      "down",
      (ev: React.PointerEvent) => {
        const consumed = this._onDown({ x: ev.clientX, y: ev.clientY });
        if (!consumed) {
          this.setIdle(false);
          return;
        }
        this.state = { type: "down", down: ev };
        this.longDownTimer = window.setTimeout(() => {
          this.state = { type: "longDown", down: ev };
          this._onLongDown({ x: ev.clientX, y: ev.clientY });
        }, PointerEventStateMachine.THRESHOLD_IDLE);
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
          ) > PointerEventStateMachine.THRESHOLD_MOVE
        ) {
          this.clearIdleTimer();
          this.state = { type: "singleMove", down };
          window.clearTimeout(this.longDownTimer);
          this.longDownTimer = -1;
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
        window.clearTimeout(this.longDownTimer);
        this.longDownTimer = -1;
      },
    ],
  ]);

  private longDownHandler = new Map([["up", () => this.setIdle(false)]]);

  private panHandler = new Map([
    [
      "move",
      (ev: React.PointerEvent, down: React.PointerEvent) => {
        this._onSingleMove(
          ev.clientX - down.clientX,
          ev.clientY - down.clientY,
          { x: ev.clientX, y: ev.clientY },
          { x: down.clientX, y: down.clientY }
        );
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
          ) > PointerEventStateMachine.THRESHOLD_MOVE
        ) {
          this.state = { type: "doubleMove", down };
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
        PointerEventStateMachine.THRESHOLD_IDLE
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
