import { Point, magnitude } from "./org/geometry";

export type PointerState =
  | { type: "idle" }
  | { type: "down"; down: React.PointerEvent }
  | { type: "longDown"; down: React.PointerEvent }
  | {
      type: "multiDown";
      down: { [pointerId: number]: React.PointerEvent };
      points: { [pointerId: number]: Point };
    }
  | { type: "keepDown"; down: React.PointerEvent }
  | { type: "move"; diff: Point; point: Point; down: React.PointerEvent }
  | { type: "singleTap"; point: Point }
  | { type: "click"; point: Point }
  | { type: "doubleDown"; down: React.PointerEvent }
  | { type: "doubleClick"; point: Point }
  | { type: "doubleMove"; point: Point; down: React.PointerEvent }
  | {
      type: "pinch";
      down: { [pointerId: number]: React.PointerEvent };
      points: { [pointerId: number]: Point };
    };

export class PointerEventStateMachine {
  private static THRESHOLD_IDLE = 300;
  private static THRESHOLD_MOVE = 10;

  private idleTimer: number = -1;
  private longDownTimer: number = -1;

  private _state: PointerState = { type: "idle" };
  private set state(state: PointerState) {
    this._state = state;
    this.onState(state);
    console.log("set", state.type);
  }
  private get state() {
    return this._state;
  }

  constructor(private onState: (state: PointerState) => void) {}

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
        this.longDownHandler.get(evType)?.(ev);
        break;
      case "multiDown":
        this.multiDownHandler.get(evType)?.(ev);
        break;
      case "keepDown":
        this.keepDownHandler.get(evType)?.(ev, this.state.down);
        break;
      case "move":
        this.moveHandler.get(evType)?.(ev, this.state.down);
        break;
      case "singleTap":
        this.singleTapHandler.get(evType)?.(ev);
        break;
      case "doubleDown":
        this.doubleDownHandler.get(evType)?.(ev, this.state.down);
        break;
      case "doubleMove":
        this.doubleZoomHandler.get(evType)?.(ev, this.state.down);
        break;
      case "pinch":
        this.pinchHandler.get(evType)?.(ev);
        break;
    }
  }
  private idleHandler = new Map([
    [
      "down",
      (ev: React.PointerEvent) => {
        this.state = { type: "down", down: ev };
        this.longDownTimer = window.setTimeout(() => {
          this.state = { type: "longDown", down: ev };
        }, PointerEventStateMachine.THRESHOLD_IDLE);
      },
    ],
  ]);

  private downHandler = new Map([
    [
      "move",
      (ev: React.PointerEvent, down: React.PointerEvent) => {
        const point = { x: ev.clientX, y: ev.clientY };
        if (
          magnitude(point, { x: down.clientX, y: down.clientY }) >
          PointerEventStateMachine.THRESHOLD_MOVE
        ) {
          this.clearIdleTimer();
          this.state = { type: "move", diff: { x: 0, y: 0 }, point, down };
          window.clearTimeout(this.longDownTimer);
          this.longDownTimer = -1;
        }
      },
    ],
    [
      "up",
      (ev: React.PointerEvent) => {
        const point = { x: ev.clientX, y: ev.clientY };
        this.state = { type: "singleTap", point };
        this.setIdle(true, () => {
          this.state = { type: "click", point };
        });
        window.clearTimeout(this.longDownTimer);
        this.longDownTimer = -1;
      },
    ],
    [
      "down",
      (ev: React.PointerEvent) => {
        if (
          this.state.type !== "down" ||
          this.state.down.pointerId === ev.pointerId
        ) {
          return;
        }
        const p0 = {
          id: this.state.down.pointerId,
          ev: this.state.down,
        };
        const p1 = { id: ev.pointerId, ev };
        this.state = {
          type: "multiDown",
          down: { [p0.id]: p0.ev, [p1.id]: p1.ev },
          points: {
            [p0.id]: { x: p0.ev.clientX, y: p0.ev.clientY },
            [p1.id]: { x: p1.ev.clientX, y: p1.ev.clientY },
          },
        };
        window.clearTimeout(this.longDownTimer);
        this.longDownTimer = -1;
      },
    ],
  ]);

  private longDownHandler = new Map([
    ["up", () => this.setIdle(false)],
    [
      "down",
      (ev: React.PointerEvent) => {
        if (
          this.state.type !== "longDown" ||
          this.state.down.pointerId === ev.pointerId
        ) {
          return;
        }
        const p0 = {
          id: this.state.down.pointerId,
          ev: this.state.down,
        };
        const p1 = { id: ev.pointerId, ev };
        this.state = {
          type: "multiDown",
          down: { [p0.id]: p0.ev, [p1.id]: p1.ev },
          points: {
            [p0.id]: { x: p0.ev.clientX, y: p0.ev.clientY },
            [p1.id]: { x: p1.ev.clientX, y: p1.ev.clientY },
          },
        };
      },
    ],
  ]);

  private multiDownHandler = new Map([
    [
      "up",
      (ev: React.PointerEvent) => {
        if (this.state.type !== "multiDown") {
          return;
        }
        if (this.state.down[ev.pointerId]) {
          delete this.state.down[ev.pointerId];
          this.state = {
            type: "keepDown",
            down: Object.values(this.state.down)[0],
          };
        }
      },
    ],
    [
      "move",
      (ev: React.PointerEvent) => {
        if (this.state.type !== "multiDown") {
          return;
        }
        // 2点間の距離がTHRESHOLD_MOVEを超えたら"pinch"
        const [d0, d1] = Object.values(this.state.down);
        const downMagnitude = Math.sqrt(
          (d0.clientX - d1.clientX) ** 2 + (d0.clientY - d1.clientY) ** 2
        );
        const { points } = this.state;
        if (!points[ev.pointerId]) {
          return;
        }
        points[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
        const [p0, p1] = Object.values(points);
        if (!p0 || !p1) {
          return;
        }
        const magnitude = Math.sqrt((p0.x - p1.x) ** 2 + (p0.y - p1.y) ** 2);
        if (
          Math.abs(downMagnitude - magnitude) >
          PointerEventStateMachine.THRESHOLD_MOVE
        ) {
          this.state = { type: "pinch", down: this.state.down, points };
        }
      },
    ],
  ]);

  private keepDownHandler = new Map([
    ["up", () => this.setIdle(false)],
    [
      "move",
      (ev: React.PointerEvent, down: React.PointerEvent) => {
        const point = { x: ev.clientX, y: ev.clientY };
        if (
          magnitude(point, { x: down.clientX, y: down.clientY }) >
          PointerEventStateMachine.THRESHOLD_MOVE
        ) {
          this.state = { type: "move", diff: { x: 0, y: 0 }, point, down };
        }
      },
    ],
  ]);

  private moveHandler = new Map([
    [
      "move",
      (ev: React.PointerEvent, down: React.PointerEvent) => {
        const point = { x: ev.clientX, y: ev.clientY };
        const diff = {
          x: point.x - down.clientX,
          y: point.y - down.clientY,
        };
        this.state = { type: "move", diff, point, down };
      },
    ],
    ["up", () => this.setIdle(false)],
    [
      "down",
      (ev: React.PointerEvent) => {
        if (
          this.state.type !== "move" ||
          this.state.down.pointerId === ev.pointerId
        ) {
          return;
        }
        const p0 = {
          id: this.state.down.pointerId,
          ev: this.state.down,
        };
        const p1 = { id: ev.pointerId, ev };
        this.state = {
          type: "multiDown",
          down: { [p0.id]: p0.ev, [p1.id]: p1.ev },
          points: {
            [p0.id]: { x: p0.ev.clientX, y: p0.ev.clientY },
            [p1.id]: { x: p1.ev.clientX, y: p1.ev.clientY },
          },
        };
      },
    ],
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
        const point = { x: ev.clientX, y: ev.clientY };
        if (
          magnitude(point, { x: down.clientX, y: down.clientY }) >
          PointerEventStateMachine.THRESHOLD_MOVE
        ) {
          this.state = { type: "doubleMove", point, down };
        }
      },
    ],
    [
      "up",
      (ev: React.PointerEvent) => {
        this.state = {
          type: "doubleClick",
          point: { x: ev.clientX, y: ev.clientY },
        };
        this.setIdle(false);
      },
    ],
  ]);

  private doubleZoomHandler = new Map([
    [
      "move",
      (ev: React.PointerEvent, down: React.PointerEvent) => {
        this.state = {
          type: "doubleMove",
          point: { x: ev.clientX, y: ev.clientY },
          down,
        };
      },
    ],
    ["up", () => this.setIdle(false)],
  ]);

  private pinchHandler = new Map([]);

  private setIdle = (shouldDelay: boolean, fn?: () => void) => {
    const callback = () => {
      fn?.();
      this.state = { type: "idle" };
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
