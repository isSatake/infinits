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
  private state: State = { type: "idle" };
  private idleTimer: number = -1;

  constructor(
    private callback: {
      onClick: () => void;
      onPan: (dx: number, dy: number) => void;
      onZoom: (point: Point, dz: number) => void;
      onAddStaff: (point: Point) => void;
    }
  ) {}

  on(evType: "down" | "move" | "up", ev: React.PointerEvent) {
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
        this.setIdleTimer();
      },
    ],
  ]);
  private downHandler = new Map([
    [
      "move",
      (ev: React.PointerEvent, down: React.PointerEvent) => {
        if (
          magnitude(
            {
              x: ev.clientX,
              y: ev.clientY,
            },
            {
              x: down.clientX,
              y: down.clientY,
            }
          ) > CanvasHandler.THRESHOLD_MOVE
        ) {
          this.clearIdleTimer();
          this.state = { type: "pan", down };
        }
      },
    ],
    [
      "up",
      () => {
        this.state = { type: "singleTap" };
        this.setIdleTimer(() => this.callback.onClick());
      },
    ],
  ]);
  private panHandler = new Map([
    [
      "move",
      (ev: React.PointerEvent, down: React.PointerEvent) => {
        this.callback.onPan(
          ev.clientX - down.clientX,
          ev.clientY - down.clientY
        );
      },
    ],
    [
      "up",
      () => {
        this.state = { type: "idle" };
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
        if (
          magnitude(
            {
              x: ev.clientX,
              y: ev.clientY,
            },
            {
              x: down.clientX,
              y: down.clientY,
            }
          ) > CanvasHandler.THRESHOLD_MOVE
        ) {
          this.state = { type: "zoom", down };
        }
      },
    ],
    [
      "up",
      (ev: React.PointerEvent) => {
        this.callback.onAddStaff({ x: ev.clientX, y: ev.clientY });
        this.state = { type: "idle" };
      },
    ],
  ]);
  private zoomHandler = new Map([
    [
      "move",
      (ev: React.PointerEvent, down: React.PointerEvent) => {
        this.callback.onZoom(
          {
            x: down.clientX,
            y: down.clientY,
          },
          ev.clientY - down.clientY
        );
      },
    ],
    [
      "up",
      () => {
        this.state = { type: "idle" };
      },
    ],
  ]);

  private setIdleTimer = (fn?: () => void) => {
    this.clearIdleTimer();
    this.idleTimer = window.setTimeout(() => {
      this.state = { type: "idle" };
      this.idleTimer = -1;
      fn?.();
    }, CanvasHandler.THRESHOLD_IDLE);
  };

  private clearIdleTimer = () => {
    window.clearTimeout(this.idleTimer);
    this.idleTimer = -1;
  };
}
