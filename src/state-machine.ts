import { magnitude } from "./org/geometry";

export class CanvasState {
  private state:
    | { type: "idle" }
    | { type: "down"; down: React.PointerEvent; moved: boolean }
    | { type: "singleTap" }
    | { type: "doubleDown"; down: React.PointerEvent; moved: boolean } = {
    type: "idle",
  };
  private idleTimer: number = -1;
  private static THRESHOLD_IDLE = 300;
  private static THRESHOLD_MOVE = 10;
  constructor(
    private onPan: (dx: number, dy: number) => void,
    private onZoom: (dz: number) => void,
    private onAddStaff: (x: number, y: number) => void
  ) {}
  onPointerDown(ev: React.PointerEvent) {
    switch (this.state.type) {
      case "idle":
        this.state = { type: "down", down: ev, moved: false };
        this.idleTimer = window.setTimeout(() => {
          this.state = { type: "idle" };
          this.idleTimer = -1;
        }, CanvasState.THRESHOLD_IDLE);
        break;
      case "singleTap":
        this.state = { type: "doubleDown", down: ev, moved: false };
        window.clearTimeout(this.idleTimer);
        this.idleTimer = -1;
        break;
    }
  }
  onPointerMove(ev: React.PointerEvent) {
    if (this.state.type === "down" || this.state.type === "doubleDown") {
      if (
        magnitude(
          {
            x: ev.clientX,
            y: ev.clientY,
          },
          {
            x: this.state.down.clientX,
            y: this.state.down.clientY,
          }
        ) > CanvasState.THRESHOLD_MOVE
      ) {
        window.clearTimeout(this.idleTimer);
        this.idleTimer = -1;
        this.state.moved = true;
        switch (this.state.type) {
          case "down":
            this.onPan(
              ev.clientX - this.state.down.clientX,
              ev.clientY - this.state.down.clientY
            );
            break;
          case "doubleDown":
            this.onZoom(ev.clientY - this.state.down.clientY);
            break;
        }
      }
    }
  }
  onPointerUp(ev: React.PointerEvent) {
    if (this.state.type === "down" || this.state.type === "doubleDown") {
      if (this.state.moved) {
        window.clearTimeout(this.idleTimer);
        this.idleTimer = -1;
        this.state = { type: "idle" };
        return;
      }
      switch (this.state.type) {
        case "down":
          this.state = { type: "singleTap" };
          window.clearTimeout(this.idleTimer);
          this.idleTimer = window.setTimeout(() => {
            this.state = { type: "idle" };
            this.idleTimer = -1;
          }, CanvasState.THRESHOLD_IDLE);
          break;
        case "doubleDown":
          this.onAddStaff(ev.clientX, ev.clientY);
          window.clearTimeout(this.idleTimer);
          this.idleTimer = -1;
          this.state = { type: "idle" };
          break;
      }
    }
  }
}
